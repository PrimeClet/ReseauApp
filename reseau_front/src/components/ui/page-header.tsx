import React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-6 mb-3 sm:mb-6">
      {/* Breadcrumb en haut sur mobile */}
      <Breadcrumb className="mb-2 sm:hidden">
        <BreadcrumbList className="flex-wrap text-xs">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {icon && (
            <div className="hidden sm:flex flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{title}</h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2 hidden sm:block">{description}</p>
            )}
            {/* Breadcrumb caché sur mobile, visible sur desktop */}
            <Breadcrumb className="mt-2 hidden sm:block">
              <BreadcrumbList className="flex-wrap">
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        {actions && <div className="flex-shrink-0 w-full sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
