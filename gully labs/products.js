const products = {
  "barfi-burgundy": {
    name: "Gully Number 001 - Barfi Burgundy",
    price: 7990,
    category: "Sneakers",
    collection: "bestsellers",
    images: ["red1.png","red2.png","red3.png","red4.png","red5.png","red6.png","red7.png","red8.png"],
    stock: { 6: 5, 7: 4, 8: 5, 9: 3, 10: 4 }
  },

  "bubblegum-pink": {
    name: "Gully Number 002 - Bubblegum Pink",
    price: 7990,
    category: "Sneakers",
    collection: "bestsellers",
    images: ["pink1.png","pink2.png","pink3.png","pink4.png","pink5.png","pink6.png","pink7.png","pink8.png"],
    stock: { 6: 4, 7: 3, 8: 4, 9: 3, 10: 2 }
  },

  "amra-ochre": {
    name: "Gully Number 003 - Amra Ochre",
    price: 7990,
    category: "Sneakers",
    collection: "bestsellers",
    images: ["white1.png","white2.png","white3.png","white4.png","white5.png","white6.png","white7.png","white8.png"],
    stock: { 6: 4, 7: 3, 8: 4, 9: 2, 10: 3 }
  },

  "buransh-red": {
    name: "Gully Number 001 - Buransh Red",
    price: 9490,
    category: "Sneakers",
    collection: "bestsellers",
    images: ["aryan1.png","aryan2.png","aryan3.png","aryan4.png","aryan5.png","aryan6.png","aryan7.png","aryan8.png","aryan9.png"],
    stock: { 6: 4, 7: 3, 8: 4, 9: 2, 10: 3 }
  },

  "slider-1": {
    name: "Gully Slider 004 - Sal Brown ",
    price: 4490,
    category: "Slides",
    collection: "slides",
    gender: "MEN",
    images: ["slider1.png","slider2.png","slider3.png","slider4.png","slider5.png","slider6.png","slider7.png","slider8.png"],
    stock: { 6: 5, 7: 4, 8: 5, 9: 4, 10: 3, 11: 2 },
    description: "A daily-wear slide made for comfort, simplicity, and effortless style."
  },

  "slider-black": {
  name: "Gully Slider 001 - Sebal Black",
  price: 4490,
  category: "Slides",
  collection: "slides",
  gender: "MEN",
  images: [
    "black1.png",
    "black2.png",
    "black3.png",
    "black4.png",
    "black5.png"
  ],
  colors: [
    { slug: "slider-brown", image: "slider1.png" },
    { slug: "slider-black", image: "black1.png" }
  ],
  stock: { 6: 5, 7: 4, 8: 5, 9: 4, 10: 3, 11: 2 }
},
  "aangan-blue": {
  name: "GL002 Aangan Blue",
  price: 7490,
  category: "Sneakers",
  collection: "slides",
  gender: "MEN",
  images: [
    "blue1.png",
    "blue2.png",
    "blue3.png",
    "blue4.png",
    "blue5.png",
    "blue6.png",
    "blue7.png",
    "blue8.png",
    "blue9.png",
    "blue10.png",
    "blue11.png"
  ],
  stock: { 6: 5, 7: 4, 8: 5, 9: 4, 10: 3, 11: 2, 12: 2 }
}
};

window.PRODUCTS = products;