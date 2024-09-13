"use strict";

import assert from "assert";
import { readFileSync } from "fs";
import { resolve, join } from "path";
import Zip from "../../adm-zip.js";
import rimraf from "rimraf";

describe("ADM-ZIP - Issues", () => {
    const destination = resolve("./test/xxx");
    const unzipped = join(destination, "unzipped");

    // clean up folder content
    afterEach((done) => rimraf(destination, done));

    it("Issue 130 - Created zip's under Windows are corrupt", () => {
        // init the final zip file
        const writeZip = new Zip();

        // file in root folder
        writeZip.addFile("root_file.txt", "root");

        // add folder
        writeZip.addFile("sub/", Buffer.alloc(0));

        // file in sub folder
        writeZip.addFile("sub/sub_file.txt", "sub");

        // files from local folder
        writeZip.addLocalFolder(resolve("./test/issue_130", "nested"), "nested");

        // write to disk
        writeZip.writeZip(join(destination, "test.zip"));

        // read zip from disk
        const readZip = new Zip(join(destination, "test.zip"));

        // unpack everything
        readZip.extractAllTo(unzipped, true);

        // assert the files
        const fileRoot = readFileSync(join(unzipped, "root_file.txt"), "utf8");
        assert(fileRoot === "root", "root file not correct");

        const fileSub = readFileSync(join(unzipped, "sub/sub_file.txt"), "utf8");
        assert(fileSub === "sub", "sub file not correct");

        const fileNested = readFileSync(join(unzipped, "nested/nested_file.txt"), "utf8");
        assert(fileNested === "nested", "nested file not correct");

        const fileDeeper = readFileSync(join(unzipped, "nested/deeper/deeper_file.txt"), "utf8");
        assert(fileDeeper === "deeper", "deeper file not correct");
    });
});
