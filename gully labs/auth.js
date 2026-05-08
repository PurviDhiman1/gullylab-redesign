const GL_USER_KEY = "gl_user";
const GL_WISHLIST_KEY = "gl_wishlist";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(GL_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(GL_USER_KEY, JSON.stringify(user));
}

function logoutUser() {
  localStorage.removeItem(GL_USER_KEY);
}

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(GL_WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

function setWishlist(items) {
  localStorage.setItem(GL_WISHLIST_KEY, JSON.stringify(items));
}

function isInWishlist(slug) {
  return getWishlist().includes(slug);
}

function toggleWishlist(slug) {
  const list = getWishlist();
  const index = list.indexOf(slug);

  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(slug);
  }

  setWishlist(list);
  return list;
}