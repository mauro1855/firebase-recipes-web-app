const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const firebaseConfig = require("./firebaseConfig");
const Utilities = require("./utilities");
const FirebaseConfig = require("./firebaseConfig");

const auth = firebaseConfig.auth;
const firestore = FirebaseConfig.firestore;

const app = express();

app.use(
  cors({
    origin: true,
  })
);
app.use(bodyParser.json());

// ~~ RESTFUL CRUD WEB API ENDPOINTS

app.post("/recipes", async (req, res) => {
  const authorizationHeader = req.headers["authorization"];

  if (!authorizationHeader) {
    res.status(401).send("Missing Authorization Header");
    return;
  }

  try {
    await Utilities.authorizeUser(authorizationHeader, auth);
  } catch (error) {
    res.status(401).send(error.message);
    return;
  }

  const newRecipe = req.body;
  const missingFields = Utilities.validateRecipePostPut(newRecipe);
  if (missingFields) {
    res
      .status(400)
      .send(`Recipe is not valid. Missing/invalid fields: ${missingFields}`);
    return;
  }

  const recipe = Utilities.sanitizeRecipePostPut(newRecipe);

  try {
    const firestoreResponse = await firestore.collection("recipes").add(recipe);
    const recipeId = firestoreResponse.id;
    res.status(201).send({
      id: recipeId,
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get("/recipes", async (req, res) => {
  const authorizationHeader = req.headers["authorization"];
  const queryObject = req.query;
  const category = queryObject["category"] || "";
  const orderByField = queryObject["orderByField"] || "";
  const orderByDirection = queryObject["orderByDirection"] || "asc";
  const pageNumber = queryObject["pageNumber"] || "";
  const perPage = queryObject["perPage"] || "";

  let isAuth = false;
  let collectionRef = firestore.collection("recipes");

  try {
    await Utilities.authorizeUser(authorizationHeader, auth);
    isAuth = true;
  } catch (error) {
    collectionRef = collectionRef.where("isPublished", "==", true);
  }

  category && (collectionRef = collectionRef.where("category", "==", category));
  orderByField &&
    (collectionRef = collectionRef.orderBy(orderByField, orderByDirection));

  if (perPage) {
    collectionRef = collectionRef.limit(Number(perPage));
  }

  if (pageNumber > 0 && perPage) {
    const pageNumberMultiplier = pageNumber - 1;
    const offset = pageNumberMultiplier * perPage;
    collectionRef = collectionRef.offset(offset);
  }

  let recipeCount = 0;

  const countDoc = await firestore
    .collection("recipeCounts")
    .doc(isAuth ? "all" : "published")
    .get();

  if (countDoc.exists) {
    const countDocData = countDoc.data();
    countDocData && (recipeCount = countDocData.count);
  }

  try {
    const firestoreResponse = await collectionRef.get();
    const fetchedRecipes = firestoreResponse.docs.map((recipe) => {
      const data = recipe.data();
      return { id: recipe.id, ...data, publishDate: data.publishDate._seconds };
    });

    const payload = {
      recipeCount,
      documents: fetchedRecipes,
    };
    res.status(200).send(payload);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.put("/recipes/:id", async (request, response) => {
  const authorizationHeader = request.headers["authorization"];
  if (!authorizationHeader) {
    response.status(401).send("Missing Authorization Header");
    return;
  }

  try {
    await Utilities.authorizeUser(authorizationHeader, auth);
  } catch (error) {
    response.status(401).send(error.message);
    return;
  }

  const id = request.params.id;
  const newRecipe = request.body;
  const missingFields = Utilities.validateRecipePostPut(newRecipe);
  if (missingFields) {
    response
      .status(400)
      .send(`Recipe is not valid. Missing/invalid fields: ${missingFields}`);
    return;
  }

  const recipe = Utilities.sanitizeRecipePostPut(newRecipe);

  try {
    const firestoreResponse = await firestore
      .collection("recipes")
      .doc(id)
      .set(recipe);
    response.status(200).send({ id });
  } catch (error) {
    response.status(400).send(error.message);
  }
});

app.delete("/recipes/:id", async (request, response) => {
  const authorizationHeader = request.headers["authorization"];
  if (!authorizationHeader) {
    response.status(401).send("Missing Authorization Header");
    return;
  }

  try {
    await Utilities.authorizeUser(authorizationHeader, auth);
  } catch (error) {
    response.status(401).send(error.message);
    return;
  }

  const id = request.params.id;

  try {
    const firestoreResponse = await firestore
      .collection("recipes")
      .doc(id)
      .delete();
    response.status(200).send();
  } catch (error) {
    response.status(400).send(error.message);
  }
});

if (process.env.NODE_ENV !== "production") {
  // Local development
  app.listen(3005, () => {
    console.log("API started");
  });
}

module.exports = app;
