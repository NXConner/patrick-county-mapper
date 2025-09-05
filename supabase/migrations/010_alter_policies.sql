-- Tighten RLS policies for workspaces and related tables

-- Workspaces: restrict select/update to owner or member
drop policy if exists "workspaces_read" on public.workspaces;
drop policy if exists "workspaces_update" on public.workspaces;
drop policy if exists "workspaces_insert" on public.workspaces;

create policy "workspaces_select_owner_or_member"
on public.workspaces for select to authenticated
using (
  owner = auth.uid() or exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspaces.name and m.user_id = auth.uid()
  )
);

create policy "workspaces_insert_owner"
on public.workspaces for insert to authenticated
with check ( owner = auth.uid() );

create policy "workspaces_update_owner_or_member"
on public.workspaces for update to authenticated
using (
  owner = auth.uid() or exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspaces.name and m.user_id = auth.uid()
  )
)
with check (
  owner = auth.uid() or exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspaces.name and m.user_id = auth.uid()
  )
);

-- Workspace members: allow owners to manage their workspace members; users can view own membership
drop policy if exists "workspace_members_self" on public.workspace_members;

create policy "workspace_members_self_view"
on public.workspace_members for select to authenticated
using ( user_id = auth.uid() );

create policy "workspace_members_owner_view"
on public.workspace_members for select to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.name = workspace_members.workspace_name and w.owner = auth.uid()
  )
);

create policy "workspace_members_owner_manage"
on public.workspace_members for all to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.name = workspace_members.workspace_name and w.owner = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.name = workspace_members.workspace_name and w.owner = auth.uid()
  )
);

-- Workspace versions: restrict select to owner or member; insert to owner or editor
drop policy if exists "workspace_versions_read" on public.workspace_versions;
drop policy if exists "workspace_versions_insert" on public.workspace_versions;

create policy "workspace_versions_select_owner_or_member"
on public.workspace_versions for select to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.name = workspace_versions.workspace_name and (
      w.owner = auth.uid() or exists (
        select 1 from public.workspace_members m where m.workspace_name = workspace_versions.workspace_name and m.user_id = auth.uid()
      )
    )
  )
);

create policy "workspace_versions_insert_owner_or_editor"
on public.workspace_versions for insert to authenticated
with check (
  exists (
    select 1 from public.workspaces w
    where w.name = workspace_versions.workspace_name and (
      w.owner = auth.uid() or exists (
        select 1 from public.workspace_members m where m.workspace_name = workspace_versions.workspace_name and m.user_id = auth.uid() and m.role in ('owner','editor')
      )
    )
  )
);

