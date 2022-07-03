const authorizeUser = async (authorizationHeader, firebaseAuth) => {
  if (!authorizationHeader) {
    throw new Error("no authorization provided!");
  }

  const token = authorizationHeader.split(" ")[1];

  return await firebaseAuth.verifyIdToken(token);
};

const validateRecipePostPut = (newRecipe) => {
  let missingFields = "";
  if (!newRecipe) {
    missingFields += "recipe";
    return missingFields;
  }

  if (!newRecipe.name) {
    missingFields += "name,";
  }
  if (!newRecipe.category) {
    missingFields += "category,";
  }
  if (!newRecipe.directions) {
    missingFields += "directions,";
  }
  if (newRecipe.isPublished == null) {
    missingFields += "isPublished,";
  }

  if (!newRecipe.publishDate) {
    missingFields += "publishDate,";
  }
  if (!newRecipe.ingredients || newRecipe.ingredients.length === 0) {
    missingFields += "ingredients,";
  }
  if (!newRecipe.imageUrl) {
    missingFields += "imageUrl,";
  }

  return missingFields;
};

const sanitizeRecipePostPut = (newRecipe) => {
  return {
    ...newRecipe,
    publishDate: new Date(newRecipe.publishDate * 1000),
  };
};

module.exports = {
  authorizeUser,
  validateRecipePostPut,
  sanitizeRecipePostPut,
};
