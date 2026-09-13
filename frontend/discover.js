// This prototype keeps the selected photograph in the browser only.
const input=document.querySelector('#photo-input');
const dropZone=document.querySelector('#drop-zone');
const uploadButton=document.querySelector('#upload-button');
const previewArea=document.querySelector('#preview-area');
const preview=document.querySelector('#image-preview');
const nowImage=document.querySelector('#now-image');
const emptyNow=document.querySelector('#empty-now');
const captureActions=document.querySelector('#capture-actions');
const result=document.querySelector('#discovery-result');
let previewUrl='';

function showImage(file){
  if(!file||!file.type.startsWith('image/'))return;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(file);
  preview.src=previewUrl; nowImage.src=previewUrl; previewArea.hidden=false; dropZone.hidden=true; captureActions.hidden=false; nowImage.hidden=false; emptyNow.hidden=true;
}
function resetImage(){
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=''; input.value=''; preview.removeAttribute('src'); nowImage.removeAttribute('src'); previewArea.hidden=true; dropZone.hidden=false; captureActions.hidden=true; nowImage.hidden=true; emptyNow.hidden=false; result.hidden=true;
}
uploadButton.addEventListener('click',()=>input.click());
dropZone.addEventListener('click',()=>input.click());
input.addEventListener('change',()=>showImage(input.files[0]));
['dragenter','dragover'].forEach(event=>dropZone.addEventListener(event,e=>{e.preventDefault();dropZone.classList.add('dragging')}));
['dragleave','drop'].forEach(event=>dropZone.addEventListener(event,e=>{e.preventDefault();dropZone.classList.remove('dragging')}));
dropZone.addEventListener('drop',e=>showImage(e.dataTransfer.files[0]));
document.querySelector('#change-button').addEventListener('click',()=>input.click());
document.querySelector('#remove-button').addEventListener('click',resetImage);
document.querySelector('#continue-button').addEventListener('click',()=>{result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'start'})});
document.querySelector('#save-button').addEventListener('click',()=>{document.querySelector('#save-message').textContent='Your heritage memory will be saved here in the next phase. ♡'});
