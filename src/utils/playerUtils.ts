export const getPositionBadge = (pos: string) => {
  const p = pos.toUpperCase();
  switch (p) {
    case "GK":
      return "bg-blue-600/10 text-blue-400 border-blue-600/20";
    case "CB":
    case "LB":
    case "RB":
    case "DF":
      return "bg-green-600/10 text-green-400 border-green-600/20";
    case "CM":
    case "CDM":
    case "CAM":
    case "MF":
      return "bg-yellow-600/10 text-yellow-400 border-yellow-600/20";
    case "ST":
    case "LW":
    case "RW":
    case "FW":
      return "bg-red-600/10 text-red-400 border-red-600/20";
    default:
      return "bg-slate-600/10 text-slate-400 border-slate-600/20";
  }
};
