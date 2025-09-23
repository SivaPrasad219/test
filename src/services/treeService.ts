export class TreeService {
  convertToTreeNode(json: any): TreeNodeModel {
    const rootNode: TreeNodeModel = {
      name: "Root",
      children: [],
    };

    Object.keys(json).forEach((key) => {
      rootNode.children.push({
        name: key,
        children: this.isObject(json[key])
          ? this.convertToChildren(json[key])
          : [{ name: json[key], children: [] }],
      });
    });

    return rootNode;
  }

  private convertToChildren(obj: any): TreeNodeModel[] {
    const children: TreeNodeModel[] = [];

    Object.keys(obj).forEach((key) => {
      children.push({
        name: key,
        children: this.isObject(obj[key])
          ? this.convertToChildren(obj[key])
          : [{ name: obj[key], children: [] }],
      });
    });

    return children;
  }

  private isObject(obj: any): boolean {
    return typeof obj === "object" && obj !== null && !Array.isArray(obj);
  }
}

export interface TreeNodeModel {
  name: string;
  children: TreeNodeModel[];
}
