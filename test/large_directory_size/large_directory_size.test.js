"use strict";

import { throws } from "assert";
import { join } from "path";
import Zip from "../../adm-zip.js";
import Errors from "../../util/errors.js";
const { DISK_ENTRY_TOO_LARGE } = Errors;
const __dirname = import.meta.dirname

describe("read zip file header with invalid large number of entries", () => {
    it("throws too large error", () => {
        // this zip file reports 2147483648 disk entry count which is impossible
        const zip = new Zip(join(__dirname, "../assets/large_directory_size.zip"));
        // assert that the following call throws an exception
        throws(() => {
            zip.getEntries();
        }, DISK_ENTRY_TOO_LARGE());
    });
});
