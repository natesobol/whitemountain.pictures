const placeholders = [
  {
    title: "Mount Lafayette",
    note: "Ridgeline glow with low cloud cover.",
  },
  {
    title: "Zealand Falls",
    note: "Mist lifting from the lower basin.",
  },
  {
    title: "Crawford Notch",
    note: "Late afternoon light on the cliffs.",
  },
  {
    title: "Mount Moosilauke",
    note: "Wide-open sky before the storm.",
  },
  {
    title: "North Twin",
    note: "Textured granite after rain.",
  },
  {
    title: "Bondcliff",
    note: "Soft shadows along the ridge spine.",
  },
];

const grid = document.getElementById("galleryGrid");

placeholders.forEach((photo) => {
  const card = document.createElement("article");
  card.className = "gallery-card";

  card.innerHTML = `
    <div class="image-placeholder">PNG coming soon</div>
    <div class="card-body">
      <h3>${photo.title}</h3>
      <p>${photo.note}</p>
    </div>
  `;

  grid.appendChild(card);
});
