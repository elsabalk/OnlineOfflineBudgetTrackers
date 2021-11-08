let database;

// Let us open our database using DB name BudgetTracker with a version 1
const requestDB = indexedDB.open("BudgetTracker", 1);

// This function will detect database version inconsitency based on the IDBOpenDBRequest interface
requestDB.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// This function fires off a successful event once requestDB is successful
// This function will also check to determine if the app is online status and then call the checkDB function 
requestDB.onsuccess = function (event) {
  database = event.target.result;
  if (navigator.onLine) {
    validateDatabaseStatus();
  }
};

// Catches any errors once event request returns type = error, concatenate error code
requestDB.onerror = function (event) {
  const errorCode = event.target.errorCode;
  console.log("Sorry there seems to be an error!: Error code " + errorCode);
};


// Since db is open with pending access this method will save the transaction
function saveTransaction(transaction) {
  const transaction = database.transaction(["pending"], "readwrite");
  const dbStore = transaction.objectStore("pending");
  dbStore.add(transaction);
}


// This function does a few things, gets all transactions stored,
//if transactions > 0 call POST Api to POST bulk data
function validateDatabaseStatus() {

  // Get all transactions
  const transaction = database.transaction(["pending"], "readwrite");
  const dbStore = transaction.objectStore("pending");
  const retrieveAll = dbStore.getAll();

  // On sucess then call the API Post call to add bulk data
  retrieveAll.onsuccess = function () {
    if (retrieveAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(retrieveAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {

          // Clear transaction stored reset
          const transaction = database.transaction(["pending"], "readwrite");
          const dbStore = transaction.objectStore("pending");
          dbStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", validateDatabaseStatus);