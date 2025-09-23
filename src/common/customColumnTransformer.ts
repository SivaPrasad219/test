import { h, ref } from "vue";
import * as Icons from "@ant-design/icons-vue";
import { Switch, Button } from "ant-design-vue";

const IconComponents: { [key: string]: any } = Object.keys(Icons).reduce(
  (acc: { [key: string]: any }, key) => {
    acc[key] = (Icons as any)[key];
    return acc;
  },
  {}
);

interface Event {
  name: string;
  handler: string;
}

interface ComponentConfig {
  type: string;
  class?: string;
  label?: string;
  name?: string;
  event?: Event;
  conditionalClass?: { [key: string]: string };
}

interface CustomColumnCell {
  styling?: {
    conditionalClassesBasedOnValues?: { [key: string]: string };
  };
  components: ComponentConfig[];
  valueMapping?: { [key: string]: string };
}

interface TableColumn {
  title: string;
  dataIndex: string;
  customColumnCell?: CustomColumnCell;
}

interface TableRow {
  [key: string]: any;
}

type HandlerFunction = (
  record: TableRow,
  checked?: boolean | string | number
) => void | Promise<void>;

type Handlers = {
  [key: string]: HandlerFunction;
};

export function transformCustomColumnCell(
  customColumnCell: CustomColumnCell,
  column: TableColumn,
  handlers: Handlers
) {
  if (!customColumnCell || !customColumnCell.components) return {};

  const { styling, components, valueMapping } = customColumnCell;
  const classes = styling?.conditionalClassesBasedOnValues || {};

  return {
    customRender: ({ record }: { record: TableRow }) => {
      if (!components || !Array.isArray(components)) return null;

      const elements = components.map((component) => {
        const { type, class: className, label, name, event } = component;

        if (type === "button") {
          return h(
            Button,
            {
              class: className,
              onClick: () => {
                if (event && handlers[event.handler]) {
                  handlers[event.handler](record);
                }
              },
            },
            { default: () => label }
          );
        } else if (type === "icon" && name) {
          const IconComponent = IconComponents[name];
          return h(IconComponent, {
            class: className,
            onClick: () => {
              if (event && handlers[event.handler]) {
                handlers[event.handler](record);
              }
            },
          });
        } else if (type === "toggle") {
          const checked = record[column.dataIndex] === valueMapping?.true;
          const loading = ref(false);

          const checkedChildren = valueMapping?.true || "ON";
          const unCheckedChildren = valueMapping?.false || "OFF";

          // Define styles for active and inactive states
          const activeStyles = { backgroundColor: "#52c41a", color: "white" };
          const inactiveStyles = { backgroundColor: "#ff4d4f", color: "white" };

          return h(Switch, {
            class: className,
            checked,
            loading: loading.value,
            checkedChildren,
            unCheckedChildren,
            style: checked ? activeStyles : inactiveStyles, // Apply styles based on the checked state
            "onUpdate:checked": async (checked: boolean | string | number) => {
              if (
                typeof checked === "boolean" &&
                event &&
                handlers[event.handler]
              ) {
                loading.value = true;
                await handlers[event.handler](record, checked);
                loading.value = false;
              }
            },
          });
        }

        return null;
      });

      return h("div", {}, elements);
    },
    customCell: (record: TableRow) => {
      const className = classes[record[column.dataIndex]];
      return { class: className };
    },
  };
}
