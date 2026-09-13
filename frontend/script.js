// The gallery is generated from the local sample data in data/heritage-data.js.
const gallery=document.querySelector('#heritage-gallery');
heritageLocations.forEach(place=>{const card=document.createElement('article');card.className='card';card.style.backgroundColor=place.color;card.innerHTML=`<span class="symbol">${place.symbol}</span><p class="location">${place.location}</p><h3>${place.name}</h3><p class="description">${place.description}</p><p class="significance"><strong>Why it matters:</strong> ${place.significance}</p>`;gallery.appendChild(card)});
