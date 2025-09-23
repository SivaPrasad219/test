import { App, Plugin } from "vue";
import { notification } from "ant-design-vue";
// import { translateLabel } from "@/common/utils";

const errorMessagePlugin: Plugin = {
  install(app: App) {
    app.config.globalProperties.$showErrorMessage = (message: string) => {
      console.log(`Error message::: ${message}`);
      notification.error({
        // message: `${translateLabel("notificationPage", "Application Error")}`,
        message: "Application Error",
        description: message,
      });
    };
  },
};

export default errorMessagePlugin;
