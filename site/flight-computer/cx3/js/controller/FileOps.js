var file_ops = {
    // URL to the ArrayBuffer blob:
    url: undefined,

    // Grab a reference to the link:
    link: undefined,

    // Grab a reference to the file input:
    fin: undefined,

    // Grab a reference to the button:
    load_file: undefined,

    // Grab a reference to the button:
    save_file: undefined,

    // Grab a reference to the file operations form:
    fops_form: undefined,

    // Create the file reader:
    file_reader: undefined,

    // Prompts the user for a file to load.
    PromptForFile: function () {
        if (confirm("Please select a file to load")) {
            var evt = new Event("click");
            file_ops.fin.dispatchEvent(evt);
        }
    },

    // Triggers a download of the data ArrayBuffer.
    DownloadData: function () {
        // Delete the old link if it exists:
        if (file_ops.url !== undefined) {
            DeleteDataURL(file_ops.url);
        }
        // Grab the data from local storage:
        var data = LocalStorageToArrayBuffer(CONST.NV_DATA_KEY);
        if (data !== undefined) {
            file_ops.url = CreateDataURL(data);
            file_ops.link.href = file_ops.url;
            var evt = new Event("click");
            file_ops.link.dispatchEvent(evt);
        }
        else {
            alert("[!] No configuration to save.");
        }

    },

    // Reads the file into an ArrayBuffer:
    LoadFile: function () {
        // Fetch the file:
        var file = file_ops.fin.files.item(0);
        // Clear the form so the user can re-submit the same file:
        file_ops.fops_form.reset();

        if (file.size < CONST.NV_DATA_SIZE) {
            alert("[!] File \"" + file.name + "\" is too small.");
        }
        else if (file.size > CONST.NV_DATA_SIZE) {
            alert("[!] File \"" + file.name + "\" is too large.");
        }
        else {
            file_ops.file_reader.readAsArrayBuffer(file);
        }
    },

    // Callback when loading a file fails:
    LoadFileFailed: function (e) {
        alert("[!] Failed to load file. Error " + e.target.error);
    },

    // Callback when loading a file fails:
    LoadFileSuccess: function (e) {
        var data_in = e.target.result;
        ArrayBufferToLocalStorage(data_in, CONST.NV_DATA_KEY);
    },

    Init: function () {
        // Grab a reference to the link=
        file_ops.link = document.getElementById("blob_link");

        // Grab a reference to the file input=
        file_ops.fin = document.getElementById("file_input");

        // Grab a reference to the button=
        file_ops.load_file = document.getElementById("load_file");

        // Grab a reference to the button=
        file_ops.save_file = document.getElementById("save_file");

        // Grab a reference to the button=
        file_ops.fops_form = document.getElementById("fops_form");

        // Create the file reader=
        file_ops.file_reader = new FileReader();
        file_ops.load_file.addEventListener("click", file_ops.PromptForFile);
        file_ops.save_file.addEventListener("click", file_ops.DownloadData);
        file_ops.fin.addEventListener("change", file_ops.LoadFile);
        file_ops.file_reader.addEventListener("load", file_ops.LoadFileSuccess);
        file_ops.file_reader.addEventListener("error", file_ops.LoadFileFailed);
    }
}

//window.addEventListener("load", file_ops.Init);

