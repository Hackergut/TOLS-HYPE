import { Fragment } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { DotIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = {
  label: string;
  to?: LinkProps["to"];
};

export function TolsBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 ? (
                <BreadcrumbSeparator>
                  <DotIcon />
                </BreadcrumbSeparator>
              ) : null}
              <BreadcrumbItem>
                {!last && item.to ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
