import { useEffect, useState } from "react";
import firebaseAuthService from "./firebaseAuthService";
import "./App.css";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import FirebaseFirestoreService from "./firebaseFirestoreService";

function App() {
  const [user, setUser] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);

  useEffect(() => {
    setIsLoading(true);

    fetchRecipes()
      .then((recipes) => setRecipes(recipes))
      .catch((error) => {
        console.error(error.message);
        throw error;
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, orderBy, recipesPerPage]);

  firebaseAuthService.subscribeToAuthChanges(setUser);

  async function fetchRecipes(cursorId = "") {
    const queries = [];

    if (categoryFilter) {
      queries.push({
        field: "category",
        condition: "==",
        value: categoryFilter,
      });
    }

    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }

    const orderByField = "publishDate";
    let orderByDirection;

    if (orderBy) {
      switch (orderBy) {
        case "publishDateAsc":
          orderByDirection = "asc";
          break;
        case "publishDateDesc":
          orderByDirection = "desc";
          break;
        default:
          break;
      }
    }

    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries,
        orderByField,
        orderByDirection,
        perPage: recipesPerPage,
        cursorId,
      });
      const newRecipes = response.docs.map((recipe) => {
        const id = recipe.id;
        const data = recipe.data();
        return {
          ...data,
          publishDate: new Date(data.publishDate.seconds * 1000),
          id,
        };
      });

      if (cursorId) {
        return [...recipes, ...newRecipes];
      }

      return [...newRecipes];
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  function handleRecipesPerPageChange(event) {
    event.preventDefault();
    const recipesPerPage = event.target.value;
    setRecipes([]);
    setRecipesPerPage(recipesPerPage);
  }

  function handleLoadMoreRecipesClick() {
    const cursorId = recipes[recipes.length - 1].id;
    handleFetchRecipes(cursorId);
  }

  async function handleFetchRecipes(cursorId = "") {
    try {
      const fetchedRecipes = await fetchRecipes(cursorId);

      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async function handleAddRecipe(newRecipe) {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );

      handleFetchRecipes();

      alert(`successfully created a recipe with ID = ${response.id}`);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleUpdateRecipe(newRecipe, recipeId) {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      handleFetchRecipes();
      alert(`Successfully updated recipe with ID ${recipeId}`);
      setCurrentRecipe(null);
    } catch (error) {
      alert(error.message);
      throw error;
    }
  }

  async function handleDeleteRecipe(recipeId) {
    const deleteConfirmation = window.confirm(
      "Are you sure you want to delete this recipe? OK for Yes, Cancel for No."
    );

    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreService.deleteDocument("recipes", recipeId);
        handleFetchRecipes();
        setCurrentRecipe(null);
        window.scrollTo(0, 0);
        alert(`Successfully deleted recipe with ID ${recipeId}`);
      } catch (error) {
        alert(error.message);
        throw Error;
      }
    }
  }

  function handleEditRecipeClick(recipeId) {
    const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);
    if (selectedRecipe) {
      setCurrentRecipe(selectedRecipe);
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function handleEditRecipeCancel() {
    setCurrentRecipe(null);
  }

  function lookupCategoryLabel(categoryKey) {
    const categories = {
      breadsSandwichesAndPizza: "Breads, Sandiches, and Pizza",
      eggsAndBreakfast: "Eggs & Breakfast",
      dessertsAndBakedGoods: "Desserts & Baked Goods",
      fishAndSeafood: "Fish & Seafood",
      vegatables: "Vegetables",
    };

    return categories[categoryKey];
  }

  function formatDate(date) {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user}></LoginForm>
      </div>
      <div className="main">
        <div className="row filters">
          <label className="recipe-label input-label">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
              required
            >
              <option value=""></option>
              <option value="breadsSandwichesAndPizza">
                Breads, Sandiches, and Pizza
              </option>
              <option value="eggsAndBreakfast">Eggs & Breakfast</option>
              <option value="dessertsAndBakedGoods">
                Desserts & Baked Goods
              </option>
              <option value="fishAndSeafood">Fish & Seafood</option>
              <option value="vegatables">Vegetables</option>
            </select>
          </label>
          <label className="input-label">
            <select
              className="select"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
            >
              <option value="publishDateAsc">
                Publish Date (oldest - newest)
              </option>
              <option value="publishDateDesc">
                Publish Date (newest - oldest)
              </option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {isLoading && (
              <div className="fire">
                <div className="flames">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </div>
                <div className="logs"></div>
              </div>
            )}
            {!isLoading && recipes && recipes.length === 0 && (
              <h5 className="no-recipes">No Recipes Found</h5>
            )}
            {!isLoading && recipes && recipes.length > 0 ? (
              <div className="recipe-list">
                {recipes.map((recipe) => {
                  return (
                    <div className="recipe-card" key={recipe.id}>
                      {!recipe.isPublished ? (
                        <div className="unpublished">UNPUBLISHED</div>
                      ) : null}
                      <div className="recipe-name"> {recipe.name}</div>
                      <div className="recipe-field">
                        Category: {lookupCategoryLabel(recipe.category)}
                      </div>
                      <div className="recipe-field">
                        Publish Date: {formatDate(recipe.publishDate)}
                      </div>
                      {user ? (
                        <button
                          type="button"
                          onClick={() => handleEditRecipeClick(recipe.id)}
                          className="primary-button edit-button"
                        >
                          EDIT
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {(isLoading || (recipes && recipes.length)) && (
          <>
            <label className="input-label">
              Recipes per page:
              <select
                value={recipesPerPage}
                onChange={handleRecipesPerPageChange}
                className="select"
              >
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="9">9</option>
              </select>
            </label>
            <div className="pagination">
              <button
                type="button"
                className="primary-button"
                onClick={handleLoadMoreRecipesClick}
              >
                LOAD MORE RECIPES
              </button>
            </div>
          </>
        )}
        {user ? (
          <AddEditRecipeForm
            existingRecipe={currentRecipe}
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleDeleteRecipe={handleDeleteRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
          ></AddEditRecipeForm>
        ) : null}
      </div>
    </div>
  );
}

export default App;
