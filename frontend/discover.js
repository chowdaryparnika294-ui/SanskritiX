const API_URL = "/api/analyze";
const RECONSTRUCT_URL = "/api/reconstruct";


const photoInput = document.getElementById("photo-input");
const dropZone = document.getElementById("drop-zone");
const uploadButton = document.getElementById("upload-button");

const previewArea = document.getElementById("preview-area");
const imagePreview = document.getElementById("image-preview");

const changeButton = document.getElementById("change-button");
const removeButton = document.getElementById("remove-button");

const captureActions = document.getElementById("capture-actions");
const continueButton = document.getElementById("continue-button");

const discoveryResult = document.getElementById("discovery-result");
const resultEyebrow = document.getElementById("result-eyebrow");
const resultTitle = document.getElementById("result-title");
const resultSummary = document.getElementById("result-summary");

const analysisLoading = document.getElementById("analysis-loading");
const analysisError = document.getElementById("analysis-error");
const analysisErrorMessage = document.getElementById("analysis-error-message");
const retryButton = document.getElementById("retry-button");

const analysisContent = document.getElementById("analysis-content");

const possiblePlace = document.getElementById("possible-place");
const confidenceText = document.getElementById("confidence-text");

const visibleEvidence = document.getElementById("visible-evidence");
const culturalElements = document.getElementById("cultural-elements");
const culturalContext = document.getElementById("cultural-context");
const uncertainty = document.getElementById("uncertainty");

const languageSelect = document.getElementById("language-select");
const storyText = document.getElementById("story-text");
const storyDisclaimer = document.getElementById("story-disclaimer");

const nowImage = document.getElementById("now-image");
const emptyNow = document.getElementById("empty-now");

const thenPanel = document.querySelector(".then-panel");

const saveButton = document.getElementById("save-button");
const saveMessage = document.getElementById("save-message");

let selectedFile = null;
let currentAnalysis = null;

console.log("SanskritiX Discover JavaScript loaded successfully.");



/* =========================================================
   INITIAL SETUP
========================================================= */

if (saveButton) {
    saveButton.disabled = true;
}



/* =========================================================
   UPLOAD BUTTON
========================================================= */

if (uploadButton) {

    uploadButton.addEventListener("click", function (event) {

        event.stopPropagation();

        if (photoInput) {
            photoInput.click();
        }

    });

}



/* =========================================================
   DROP ZONE
========================================================= */

if (dropZone) {

    dropZone.addEventListener("click", function () {

        if (photoInput) {
            photoInput.click();
        }

    });


    dropZone.addEventListener("keydown", function (event) {

        if (event.key === "Enter" || event.key === " ") {

            event.preventDefault();

            if (photoInput) {
                photoInput.click();
            }

        }

    });


    dropZone.addEventListener("dragover", function (event) {

        event.preventDefault();

        dropZone.classList.add("dragging");

    });


    dropZone.addEventListener("dragleave", function () {

        dropZone.classList.remove("dragging");

    });


    dropZone.addEventListener("drop", function (event) {

        event.preventDefault();

        dropZone.classList.remove("dragging");

        const file =
            event.dataTransfer.files[0];

        if (file) {
            handleSelectedFile(file);
        }

    });

}



/* =========================================================
   FILE INPUT
========================================================= */

if (photoInput) {

    photoInput.addEventListener("change", function (event) {

        const file =
            event.target.files[0];

        if (file) {
            handleSelectedFile(file);
        }

    });

}



/* =========================================================
   HANDLE IMAGE
========================================================= */

function handleSelectedFile(file) {

    if (!file.type.startsWith("image/")) {

        alert("Please select an image file.");

        return;
    }


    selectedFile = file;


    const imageURL =
        URL.createObjectURL(file);


    if (imagePreview) {
        imagePreview.src = imageURL;
    }


    if (previewArea) {
        previewArea.hidden = false;
    }


    if (dropZone) {
        dropZone.hidden = true;
    }


    if (captureActions) {
        captureActions.hidden = false;
    }


    if (continueButton) {
        continueButton.disabled = false;
    }


    if (nowImage) {
        nowImage.src = imageURL;
        nowImage.hidden = false;
    }


    if (emptyNow) {
        emptyNow.hidden = true;
    }


    resetDiscovery();

}



/* =========================================================
   CHANGE IMAGE
========================================================= */

if (changeButton) {

    changeButton.addEventListener("click", function () {

        if (photoInput) {
            photoInput.click();
        }

    });

}



/* =========================================================
   REMOVE IMAGE
========================================================= */

if (removeButton) {

    removeButton.addEventListener("click", function () {

        selectedFile = null;

        if (photoInput) {
            photoInput.value = "";
        }

        if (previewArea) {
            previewArea.hidden = true;
        }

        if (dropZone) {
            dropZone.hidden = false;
        }

        if (captureActions) {
            captureActions.hidden = true;
        }

        if (imagePreview) {
            imagePreview.src = "";
        }

        if (nowImage) {
            nowImage.src = "";
            nowImage.hidden = true;
        }

        if (emptyNow) {
            emptyNow.hidden = false;
        }

        if (continueButton) {
            continueButton.disabled = true;
        }

        resetDiscovery();

    });

}



/* =========================================================
   RESET DISCOVERY
========================================================= */

function resetDiscovery() {

    currentAnalysis = null;


    if (discoveryResult) {
        discoveryResult.hidden = true;
    }


    if (analysisLoading) {
        analysisLoading.hidden = true;
    }


    if (analysisError) {
        analysisError.hidden = true;
    }


    if (analysisContent) {
        analysisContent.hidden = true;
    }


    if (saveMessage) {
        saveMessage.hidden = true;
        saveMessage.innerHTML = "";
    }


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Save to My Sanskriti ♡";

        saveButton.classList.remove(
            "memory-saved"
        );

    }


    removeOpenMemoryButton();

}



/* =========================================================
   CONTINUE
========================================================= */

if (continueButton) {

    continueButton.addEventListener("click", async function () {

        if (!selectedFile) {

            alert(
                "Please upload an image first."
            );

            return;
        }

        await analyzeImage();

    });

}



/* =========================================================
   ANALYZE IMAGE
========================================================= */

async function analyzeImage() {

    if (!selectedFile) {
        return;
    }


    if (discoveryResult) {
        discoveryResult.hidden = false;
    }


    if (analysisLoading) {
        analysisLoading.hidden = false;
    }


    if (analysisError) {
        analysisError.hidden = true;
    }


    if (analysisContent) {
        analysisContent.hidden = true;
    }


    if (continueButton) {

        continueButton.disabled = true;

        continueButton.textContent =
            "Discovering...";

    }


    if (saveButton) {
        saveButton.disabled = true;
    }


    try {

        const formData =
            new FormData();

        formData.append(
            "image",
            selectedFile
        );


        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to analyze the image."
            );

        }


        if (
            data.status &&
            data.status !== "success"
        ) {

            throw new Error(
                data.message ||
                "Image analysis failed."
            );

        }


        currentAnalysis = data;


        displayAnalysis(data);


        updateThenPanel(data);


        enableSaveButton();


        if (analysisLoading) {
            analysisLoading.hidden = true;
        }


        if (analysisContent) {
            analysisContent.hidden = false;
        }


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        if (analysisLoading) {
            analysisLoading.hidden = true;
        }


        if (analysisError) {
            analysisError.hidden = false;
        }


        if (analysisErrorMessage) {

            analysisErrorMessage.textContent =
                error.message ||
                "Something went wrong while analyzing the photograph.";

        }

    } finally {

        if (continueButton) {

            continueButton.disabled = false;

            continueButton.textContent =
                "Continue to discovery ↓";

        }

    }

}



/* =========================================================
   RETRY
========================================================= */

if (retryButton) {

    retryButton.addEventListener("click", function () {

        if (selectedFile) {
            analyzeImage();
        }

    });

}



/* =========================================================
   DISPLAY ANALYSIS
========================================================= */

function displayAnalysis(data) {

    const place =
        data.possible_place ||
        "Heritage location";


    const summary =
        data.summary ||
        data.cultural_context ||
        "Discover the cultural story behind this place.";


    if (resultEyebrow) {

        resultEyebrow.textContent =
            "— HERITAGE DISCOVERY";

    }


    if (resultTitle) {

        resultTitle.innerHTML =
            `Discovering <em>${escapeHTML(place)}</em>`;

    }


    if (resultSummary) {
        resultSummary.textContent = summary;
    }


    if (possiblePlace) {
        possiblePlace.textContent = place;
    }


    if (confidenceText) {

        let confidence = null;


        if (
            typeof data.confidence === "number"
        ) {

            confidence =
                data.confidence <= 1
                    ? Math.round(
                        data.confidence * 100
                    )
                    : Math.round(
                        data.confidence
                    );

        }


        confidenceText.textContent =
            confidence !== null
                ? `${confidence}% AI confidence`
                : "AI-assisted discovery";

    }


    renderList(
        visibleEvidence,
        data.visible_evidence ||
        data.evidence ||
        []
    );


    renderList(
        culturalElements,
        data.cultural_elements ||
        []
    );


    renderText(
        culturalContext,
        data.cultural_context ||
        data.summary ||
        "No additional cultural context was returned."
    );


    renderText(
        uncertainty,
        data.uncertainty ||
        "The identification is AI-assisted and should be verified for important historical claims."
    );


    const story =
        data.story ||
        data.story_preview ||
        "A cultural story for this place is being prepared.";


    renderStory(story);


    if (languageSelect) {
        languageSelect.disabled = false;
    }


    if (nowImage && selectedFile) {

        nowImage.src =
            URL.createObjectURL(
                selectedFile
            );

        nowImage.hidden = false;

    }

}



/* =========================================================
   RENDER LIST
========================================================= */

function renderList(element, items) {

    if (!element) {
        return;
    }


    element.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement("li");

        li.textContent =
            "No additional information is available.";

        element.appendChild(li);

        return;
    }


    items.forEach(function (item) {

        const li =
            document.createElement("li");

        li.textContent =
            item;

        element.appendChild(li);

    });

}



/* =========================================================
   RENDER TEXT
========================================================= */

function renderText(element, text) {

    if (!element) {
        return;
    }


    element.textContent =
        text ||
        "No additional information is available.";

}



/* =========================================================
   STORY
========================================================= */

function renderStory(story) {

    if (!storyText) {
        return;
    }


    if (Array.isArray(story)) {

        storyText.textContent =
            story.join(" ");

    } else {

        storyText.textContent =
            story ||
            "Your cultural story will appear here.";

    }


    if (storyDisclaimer) {

        storyDisclaimer.textContent =
            "AI-generated cultural context, not verified historical fact.";

    }

}



/* =========================================================
   THEN PANEL
========================================================= */

function updateThenPanel(data) {

    if (!thenPanel) {
        return;
    }


    const place =
        data.possible_place ||
        "this heritage location";


    thenPanel.innerHTML = `

        <div class="panel-tag">
            THEN
        </div>

        <div class="then-content">

            <span class="then-icon">
                ✦
            </span>

            <h3>
                Explore the historical view.
            </h3>

            <p>
                SanskritiX can create an AI-assisted
                historical reconstruction inspired by
                ${escapeHTML(place)}.
            </p>

            <button
                type="button"
                class="generate-history-button"
                id="generate-history-button"
            >
                Generate historical view →
            </button>

            <small>
                AI-assisted reconstruction — an artistic
                interpretation, not a verified historical photograph.
            </small>

        </div>

    `;


    const button =
        document.getElementById(
            "generate-history-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                generateHistoricalView(
                    data,
                    button
                );

            }
        );

    }

}



/* =========================================================
   HISTORICAL VIEW
========================================================= */

async function generateHistoricalView(
    data,
    button
) {

    if (!selectedFile) {

        alert(
            "Please upload an image first."
        );

        return;
    }


    button.disabled = true;

    button.textContent =
        "Creating historical view...";


    try {

        const formData =
            new FormData();


        formData.append(
            "image",
            selectedFile
        );


        formData.append(
            "possible_place",
            data.possible_place || ""
        );


        formData.append(
            "cultural_context",
            data.cultural_context || ""
        );


        const response =
            await fetch(
                RECONSTRUCT_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                result.message ||
                "Historical reconstruction failed."
            );

        }


        if (
            !result.image_base64 &&
            !result.image
        ) {

            throw new Error(
                "The AI did not return a historical image."
            );

        }


        showHistoricalImage(result);


    } catch (error) {

        console.error(
            "Historical reconstruction error:",
            error
        );


        alert(
            "We could not create the historical visualization.\n\n" +
            error.message
        );


        button.disabled = false;

        button.textContent =
            "Generate historical view →";

    }

}



/* =========================================================
   SHOW HISTORICAL IMAGE
========================================================= */

function showHistoricalImage(result) {

    if (!thenPanel) {
        return;
    }


    const imageBase64 =
        result.image_base64 ||
        result.image;


    const mimeType =
        result.mime_type ||
        "image/png";


    thenPanel.innerHTML = `

        <div class="panel-tag">
            THEN
        </div>

        <div class="historical-result">

            <div class="historical-image-wrap">

                <img
                    src="data:${mimeType};base64,${imageBase64}"
                    alt="AI-assisted historical reconstruction"
                    class="historical-image"
                >

            </div>

            <div class="historical-badge">
                AI-ASSISTED RECONSTRUCTION
            </div>

            <h3>
                A glimpse into the past.
            </h3>

            <p>
                This visualization is an AI-assisted
                artistic reconstruction inspired by
                the heritage location in your photograph.
            </p>

            <small>
                Not a verified historical photograph.
                Details may be interpretive and should
                not be treated as exact historical fact.
            </small>

        </div>

    `;

}



/* =========================================================
   ENABLE SAVE
========================================================= */

function enableSaveButton() {

    if (!saveButton) {
        return;
    }


    saveButton.disabled = false;


    saveButton.textContent =
        "Save to My Sanskriti ♡";

}



/* =========================================================
   SAVE TO MY SANSKRITI
========================================================= */

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async function () {

            if (!selectedFile) {

                alert(
                    "Please upload a photograph first."
                );

                return;
            }


            if (!currentAnalysis) {

                alert(
                    "Please complete the heritage discovery first."
                );

                return;
            }


            try {

                saveButton.disabled = true;

                saveButton.textContent =
                    "Saving memory...";


                const compressedImage =
                    await createCompressedImageData(
                        selectedFile
                    );


                const memory = {

                    id:
                        Date.now().toString(),

                    place:
                        currentAnalysis.possible_place ||
                        "Indian Heritage",

                    summary:
                        currentAnalysis.summary ||
                        currentAnalysis.cultural_context ||
                        "A cultural discovery saved with SanskritiX.",

                    story:
                        Array.isArray(
                            currentAnalysis.story
                        )
                            ? currentAnalysis.story.join(" ")
                            : (
                                currentAnalysis.story ||
                                currentAnalysis.story_preview ||
                                "A cultural story preserved with this memory."
                            ),

                    cultural_elements:
                        Array.isArray(
                            currentAnalysis.cultural_elements
                        )
                            ? currentAnalysis.cultural_elements
                            : [],

                    image:
                        compressedImage,

                    language:
                        languageSelect
                            ? languageSelect.value
                            : "English",

                    savedAt:
                        new Date().toISOString()

                };



                /* -----------------------------------------
                   READ EXISTING MEMORIES
                ----------------------------------------- */

                let memories = [];


                const oldData =
                    localStorage.getItem(
                        "sanskritix_memories"
                    );


                if (oldData) {

                    try {

                        const parsed =
                            JSON.parse(oldData);


                        if (Array.isArray(parsed)) {

                            memories =
                                parsed;

                        } else if (parsed) {

                            memories =
                                [parsed];

                        }

                    } catch (error) {

                        console.warn(
                            "Existing memory data could not be read."
                        );

                        memories = [];

                    }

                }



                /* -----------------------------------------
                   ADD MEMORY
                ----------------------------------------- */

                memories.push(memory);



                /* -----------------------------------------
                   SAVE
                ----------------------------------------- */

                localStorage.setItem(
                    "sanskritix_memories",
                    JSON.stringify(memories)
                );


                console.log(
                    "Memory successfully saved:",
                    memory
                );



                /* -----------------------------------------
                   SHOW SUCCESS MESSAGE
                ----------------------------------------- */

                if (saveMessage) {

                    saveMessage.hidden = false;

                    saveMessage.innerHTML = `
                        <span>
                            Memory saved locally for this demo.
                        </span>
                    `;

                }



                /* -----------------------------------------
                   SHOW OPEN MY SANSKRITI BUTTON
                ----------------------------------------- */

                createOpenMemoryButton();



                /* -----------------------------------------
                   UPDATE SAVE BUTTON
                ----------------------------------------- */

                saveButton.disabled = false;

                saveButton.textContent =
                    "Saved to My Sanskriti ♥";

                saveButton.classList.add(
                    "memory-saved"
                );


            } catch (error) {

                console.error(
                    "Memory save error:",
                    error
                );


                saveButton.disabled = false;

                saveButton.textContent =
                    "Save to My Sanskriti ♡";


                if (saveMessage) {

                    saveMessage.hidden = false;

                    saveMessage.textContent =
                        "We could not save this memory. Please try again.";

                }

            }

        }
    );

}



/* =========================================================
   CREATE OPEN MY SANSKRITI BUTTON
========================================================= */

function createOpenMemoryButton() {

    removeOpenMemoryButton();


    const button =
        document.createElement("a");


    button.id =
        "open-memory-button";


    button.href =
        "memory.html";


    button.className =
        "button open-memory-button";


    button.textContent =
        "Open My Sanskriti ↗";


    button.style.display =
        "inline-flex";


    button.style.marginTop =
        "14px";


    button.style.textDecoration =
        "none";


    button.style.alignItems =
        "center";


    button.style.justifyContent =
        "center";


    button.style.background =
        "#253531";


    button.style.color =
        "#fffdfa";


    button.style.border =
        "1px solid #253531";


    button.style.cursor =
        "pointer";


    /*
     * Put the button directly after
     * the save message.
     */

    if (saveMessage) {

        saveMessage.insertAdjacentElement(
            "afterend",
            button
        );

    } else if (saveButton) {

        saveButton.insertAdjacentElement(
            "afterend",
            button
        );

    }


    console.log(
        "Open My Sanskriti button created."
    );

}



/* =========================================================
   REMOVE OPEN BUTTON
========================================================= */

function removeOpenMemoryButton() {

    const oldButton =
        document.getElementById(
            "open-memory-button"
        );


    if (oldButton) {
        oldButton.remove();
    }

}



/* =========================================================
   COMPRESS IMAGE
========================================================= */

function createCompressedImageData(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    const img =
                        new Image();


                    img.onload =
                        function () {

                            const maxWidth =
                                1000;


                            let width =
                                img.width;


                            let height =
                                img.height;


                            if (
                                width > maxWidth
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        (
                                            maxWidth /
                                            width
                                        )
                                    );


                                width =
                                    maxWidth;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            const compressed =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.78
                                );


                            resolve(
                                compressed
                            );

                        };


                    img.onerror =
                        function () {

                            reject(
                                new Error(
                                    "Could not process the image."
                                )
                            );

                        };


                    img.src =
                        reader.result;

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not read the image."
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}



/* =========================================================
   LANGUAGE
========================================================= */

if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        function () {

            console.log(
                "Selected story language:",
                languageSelect.value
            );

        }
    );

}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}