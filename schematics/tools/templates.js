"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const parse_name_1 = require("@schematics/angular/utility/parse-name");
function addTemplates(path, name) {
    const parsedPath = parse_name_1.parseName(path, name);
    console.log(schematics_1.url('./files'));
    const templateSource = schematics_1.apply(schematics_1.url('./files'), [
        schematics_1.template(Object.assign({}, core_1.strings, parsedPath, { type: '' })),
        schematics_1.move(parsedPath.path)
    ]);
    return schematics_1.mergeWith(templateSource);
}
exports.addTemplates = addTemplates;
//# sourceMappingURL=templates.js.map