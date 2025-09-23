// roles.ts
export const rolePermissions: Record<string, string[]> = {
  "/devicetype": ["administrator", "operator", "auditor", "tester"],
  "/manage": ["administrator"],
  "/monitoring": ["administrator"],
  "/apc/instrument/device": ["administrator"],
  "/apc/measure": ["operator"],
  "/apc/lims": ["operator"],
  "/clients": ["super-admin"],
  // Add other routes and their allowed roles here
};
