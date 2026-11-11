import type { Rule } from "../types.js";
import { pg001 } from "./pg001-unmatched-os-branch.js";
import { pg002 } from "./pg002-incomplete-platform-select.js";
import { pg003 } from "./pg003-divergent-platform-files.js";
import { makePermissionRule } from "./permissions.js";

export const rules: Rule[] = [pg001, pg002, pg003, makePermissionRule("ios"), makePermissionRule("android")];
