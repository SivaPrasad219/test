// src/services/errorHandler.ts

const errorHandler = {
  install: (app: any) => {
    app.config.errorHandler = (err: any) => {
      console.error(err);
      const showErrorMessage = app.config.globalProperties.$showErrorMessage;
      if (showErrorMessage) {
        showErrorMessage(
          "An error occurred while updating the application. Please try refreshing the page."
        );
      }
    };
  },
};

export default errorHandler;
