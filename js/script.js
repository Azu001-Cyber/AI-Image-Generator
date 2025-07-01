const imageControls = document.querySelectorAll(".image-only"); 

const themeToggle = document.querySelector('.theme-toggle');
const promptForm = document.querySelector('.prompt-form');
const promptInput = document.querySelector('.prompt-input');
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");

const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const modeSelect = document.getElementById("mode-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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";//Hugging face API key



const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
];

(() =>{
    const savedTheme = localStorage.getItem("theme");
    const systemPreferDark = window.matchMedia("(prefer-color-sceme:dark)").matches;

    // set theme based on saved preference or system default
    const isDarkTheme = savedTheme === 'dark'|| (!savedTheme && systemPreferDark);
    document.body.classList.toggle("dark-theme", isDarkTheme)
    themeToggle.querySelector('i').classList = isDarkTheme ? 'fa-solid fa-sun' : 'bi bi-moon-fill';
})();
// Switch between light and dark themes
const toggleTheme = () => {
    const  isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : 'light');
    themeToggle.querySelector('i').classList = isDarkTheme ? 'fa-solid fa-sun' : 'bi bi-moon-fill';
}

const toggleModeControls = () => {
    const selectedMode = modeSelect.value;
    imageControls.forEach(control => {
        control.style.display = selectedMode === "image" ? "block" : "none";
    });
};





// calculate width and height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) =>{
    const [width, height] = aspectRatio.split('/').map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    // Endure dimensions are multiples 0f 16 (AI model requirements)
    calculatedWidth = Math.floor(calculatedWidth / 16)* 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return {width:calculatedWidth, height:calculatedHeight};
}


// Replace loading spinner with the actual image
const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;

    imgCard.classList.remove('loading');
    imgCard.innerHTML = `<img src="${imgUrl}" alt="" class="result-img">
                        <div class="img-overlay">
                            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                <i class="bi bi-download"></i>
                            </a>
                        </div>`;
}

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) =>{
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;

    const {width, height} = getImageDimensions(aspectRatio);

    generateBtn.setAttribute("disabled", "true");

 // Create an array of image generation promises
    const imagePromises = Array.from({length:imageCount}, async(_, i) => {
        
    //    Send request to the AI model API
    try{
        const response = await fetch( MODEL_URL, {
            headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
                "x-use-catch":"false",
			},
			method: "POST",
			body: JSON.stringify({
                inputs: promptText,
                parameters: {width, height},
                options: {wait_for_model: true, user_cache:false},
            }),
        });

        if (!response.ok) {
                const errorText = await response.text(); // Avoid .json() crash
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        // Convert response to an Image URL and update the images
        const result = await response.blob();
        updateImageCard(i, URL.createObjectURL(result));

    }catch (error) {
        console.log(error);
        const imgCard = document.getElementById(`img-card-${i}`);
        imgCard.classList.replace("loading", "error");
        imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
    }
    });
    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled")
}

// create placeholder cards with loading spinners
    const createImageCard = (selectedModel, imageCount, aspectRatio, promptText) => {

        gridGallery.innerHTML = "";

        for (let i = 0; i < imageCount; i++){
            gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" 
            style="aspect-ratio: ${aspectRatio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>`;
        }
        generateImages(selectedModel, imageCount, aspectRatio, promptText)
    }

    //  handels video creation
const generateVideo = async (selectedModel, promptText) => {
    const endpoint = `https://api-inference.huggingface.co/models/${selectedModel}`;
    generateBtn.setAttribute("disabled", "true");

    // Show loading UI
    gridGallery.innerHTML = `
        <div class="img-card loading" id="video-card-0">
            <div class="status-container">
                <div class="spinner"></div>
                <p class="status-text">Generating video from Hugging Face...</p>
            </div>
        </div>
    `;

    try {
        // Send prompt to Hugging Face model
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "x-use-cache": "false"
            },
            body: JSON.stringify({
                inputs: promptText,
                parameters: {
                    num_frames: 16,
                    fps: 8
                },
                options: {
                    wait_for_model: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        // Get video blob and convert to local URL
        const result = await response.blob();
        const videoUrl = URL.createObjectURL(result);

        // Display the video
        const card = document.getElementById("video-card-0");
        card.classList.remove("loading");
        card.innerHTML = `
            <video controls autoplay loop muted width="100%">
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="img-overlay">
                <a href="${videoUrl}" class="img-download-btn" download="huggingface-video.mp4">
                    <i class="bi bi-download"></i>
                </a>
            </div>
        `;
    } catch (error) {
        console.error(error);
        const card = document.getElementById("video-card-0");
        card.classList.replace("loading", "error");
        card.innerHTML = `
            <div class="status-container">
                <p class="status-text">Video generation failed. Check console.</p>
            </div>
        `;
    }

    generateBtn.removeAttribute("disabled");
};




    // Handel Form submission
const handleFormSubmit = (e) =>{
    e.preventDefault();



    const selectedModel = modelSelect.value;
    const selectedMode = modeSelect.value



    const imageCount = parseInt(countSelect.value) || 1;

    const aspectRatio = ratioSelect.value || "1/1";

    const promptText = promptInput.value.trim();
    
    if (!selectedModel || !selectedMode || !promptText) {
    alert("Please select all fields.");
    return;
    }

    if (selectedMode === "image"){
        createImageCard(selectedModel, imageCount, aspectRatio, promptText);

        generateImages(selectedModel, imageCount, aspectRatio, promptText)
    }else if(selectedMode === "video"){
        generateVideo(selectedModel, promptText)
    }

}
//  Fill prompt input with random example
promptBtn.addEventListener('click', () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
})


promptForm.addEventListener("submit", handleFormSubmit)
themeToggle.addEventListener("click", toggleTheme);
modeSelect.addEventListener("change", toggleModeControls);

toggleModeControls();
