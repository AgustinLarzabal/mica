import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import type { VariantProps } from "class-variance-authority"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-none text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "rounded-full bg-border group-data-horizontal/tabs:h-7",
        line: "bg-transparent group-data-horizontal/tabs:h-11",
        responsive:
          "rounded-full bg-border group-data-horizontal/tabs:h-7 lg:rounded-none lg:bg-transparent lg:group-data-horizontal/tabs:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-medium tracking-widest whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:py-[calc(--spacing(1.25))] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-b group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:tracking-wider group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-secondary-foreground dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "lg:group-data-[variant=responsive]/tabs-list:rounded-none lg:group-data-[variant=responsive]/tabs-list:border-b lg:group-data-[variant=responsive]/tabs-list:bg-transparent lg:group-data-[variant=responsive]/tabs-list:tracking-wider lg:group-data-[variant=responsive]/tabs-list:data-active:bg-transparent dark:lg:group-data-[variant=responsive]/tabs-list:data-active:border-secondary-foreground dark:lg:group-data-[variant=responsive]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:bg-chart-4 dark:data-active:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-xs/relaxed outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger }
