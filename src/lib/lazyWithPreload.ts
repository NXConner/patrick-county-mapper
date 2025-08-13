import React, { lazy } from "react";

type DefaultExport<T> = { default: T };

export type Preloadable<T extends React.ComponentType<unknown>> = React.LazyExoticComponent<T> & {
  preload: () => Promise<DefaultExport<T>>;
};

export function lazyWithPreload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<DefaultExport<T>>
): Preloadable<T> {
  const LazyComponent = lazy(factory) as Preloadable<T>;
  LazyComponent.preload = factory;
  return LazyComponent;
}