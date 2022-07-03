const FirebaseConfig = require("./firebaseConfig");
const recipesApi = require("./recipesApi");
const functions = FirebaseConfig.functions;
const firestore = FirebaseConfig.firestore;
const storageBucket = FirebaseConfig.storageBucket;
const admin = FirebaseConfig.admin;

const updatePublishedCount = async (toAdd, initialCount) => {
  const countPublishedDocRef = firestore
    .collection("recipeCounts")
    .doc("published");
  const countPublishedDoc = await countPublishedDocRef.get();
  if (countPublishedDoc.exists) {
    countPublishedDocRef.update({
      count: admin.firestore.FieldValue.increment(toAdd),
    });
  } else {
    countPublishedDocRef.set({ count: initialCount });
  }
};

const updateDocCount = async (toAdd, initialCount) => {
  const countDocRef = firestore.collection("recipeCounts").doc("all");
  const countDoc = await countDocRef.get();
  if (countDoc.exists) {
    countDocRef.update({ count: admin.firestore.FieldValue.increment(toAdd) });
  } else {
    countDocRef.set({ count: initialCount });
  }
};

exports.onCreateRecipe = functions.firestore
  .document("recipes/{recipeId}")
  .onCreate(async (snapshot) => {
    const recipe = snapshot.data();
    await updateDocCount(1, 1);
    recipe.isPublished && (await updatePublishedCount(1, 1));
  });

exports.onDeleteRecipe = functions.firestore
  .document("recipes/{recipeId}")
  .onDelete(async (snapshot) => {
    const recipe = snapshot.data;
    const imageUrl = recipe.imageUrl;
    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      const startIndex = decodedUrl.indexOf("/o/") + 3;
      const endIndex = decodedUrl.indexOf("?");
      const fullFilePath = decodedUrl.substring(startIndex, endIndex);
      const file = storageBucket.file(fullFilePath);

      console.log(`Attempting to delete ${fullFilePath}`);
      try {
        await file.delete();
        console.log("Successfully deleted image");
      } catch (error) {
        console.log(`Failed to delete file: ${error.message}`);
      }
    }
    await updateDocCount(-1, 0);
    recipe.isPublished && (await updatePublishedCount(-1, 0));
  });

exports.onUpdateRecipe = functions.firestore
  .document("recipes/{recipeId}")
  .onUpdate(async (changes) => {
    const oldRecipes = changes.before.data();
    const newRecipe = changes.after.data();

    let publishedCount = 0;

    if (!oldRecipes.isPublished && newRecipe.isPublished) {
      publishedCount += 1;
    } else if (oldRecipes.isPublished && !newRecipe.isPublished) {
      publishedCount -= 1;
    }

    if (publishedCount !== 0) {
      await updatePublishedCount(publishedCount, 0);
    }
  });

const runtimeOptions = {
  timeoutSeconds: 300,
  memory: "256MB",
};

exports.dailyCheckRecipePublishDate = functions
  .runWith(runtimeOptions)
  .pubsub.schedule("0 0 * * *")
  .onRun(async () => {
    console.log("dailyCheckRecipePublishDate called - time to check");
    const snapshot = await firestore
      .collection("recipes")
      .where("isPublished", "==", false)
      .get();

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const now = Date.now() / 1000;
      const isPublished = data.publishDate._seconds <= now;
      if (isPublished) {
        await firestore.collection("recipes").doc(doc.id).set(
          {
            isPublished,
          },
          { merge: true }
        );
        console.log(`Recipe "${data.name}" is now published`);
      }
    });
  });

exports.api = functions.https.onRequest(recipesApi);

console.log("Server Started");
