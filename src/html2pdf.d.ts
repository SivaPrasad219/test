declare module "html2pdf.js" {
  const html2pdf: any;
  export default html2pdf;
}

declare module "json2xml" {
  interface Json2XmlOptions {
    header?: boolean;
    attributes_key?: string;
    value_key?: string;
    xmlHeader?: boolean;
    prettyPrint?: boolean;
    indent?: string;
    removeIllegalNameCharacters?: boolean;
  }

  function json2xml(json: object, options?: Json2XmlOptions): string;

  export default json2xml;
}
