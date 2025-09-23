const exportFile = (data: any, name: any, dataType: any) => {
  const blob = new Blob([data], {
    type: "application/octet-stream",
  });
  const date = new Date().toISOString().slice(0, 19).replace(/[-:]/g, "");
  const filename = `${name}-${date}.${dataType}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export default exportFile;
