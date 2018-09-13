"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const config_1 = require("@schematics/angular/utility/config");
const project_1 = require("@schematics/angular/utility/project");
const templates_1 = require("../tools/templates");
function install(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option (project) is required.');
        }
        const project = workspace.projects[options.project];
        const path = project_1.buildDefaultPath(project);
        return schematics_1.chain([templates_1.addTemplates(path + '/', 'app')]);
    };
}
exports.install = install;
//# sourceMappingURL=index.js.map