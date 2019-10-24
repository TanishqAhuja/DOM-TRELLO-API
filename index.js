var key = "{-key-here-}";
var token = "{-token-here-}";
var cardId = "{-card-id-here-}";

var checkListUrl = `https://api.trello.com/1/cards/${cardId}/checklists`;
var listItemUrl = `https://api.trello.com/1/checklists`;
var keyUrl = `key=${key}`;
var tokenUrl = `token=${token}`;

async function fetchUtil(setUrl, setMethod) {
  let reasponse = await fetch(setUrl, { method: setMethod });
  let data = await reasponse.json();
  return data;
};

function getForm(listID, classes, pHolder, btn) {
  return `<div class="card-body">
  <form class="${classes}" data-checkListID=${listID}>
    <div class="input-group">
      <input
        class="form-control new-item"
        data-checkListID = ${listID}
        type="text"
        placeholder=${pHolder}
        autocomplete="off"
        required
      />
      <span class="input-group-btn">
        <button class="btn btn-info" type="submit">${btn}</button>
      </span>
    </div>
</form>
</div>`;
};

function getCheckLists() {
  let setUrl = `${checkListUrl}?${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "GET");
};

function postCheckList(checkListName) {
  var nameUrl = `name=${checkListName}`;
  let setUrl = `${checkListUrl}?${nameUrl}&${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "POST");
};

function delCheckList(checkListID) {
  let setUrl = `${checkListUrl}/${checkListID}?${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "DELETE");
};

function renameCheckList(checkListID, newName) {
  let setUrl = `${listItemUrl}/${checkListID}/name?value=${newName}&${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "PUT");
}

function postCheckItem(checkListID, checkItemName) {
  var nameUrl = `name=${checkItemName}`;
  let setUrl = `${listItemUrl}/${checkListID}/checkItems?${nameUrl}&pos=bottom&checked=false&${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "POST");
};

function delCheckItem(checkListID, checkItemID) {
  let setUrl = `${listItemUrl}/${checkListID}/checkItems/${checkItemID}?${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "DELETE");
}

function renameCheckItem(checkItemID, newName) {
  let setUrl = `https://api.trello.com/1/cards/${cardId}/checkItem/${checkItemID}?name=${newName}&${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "PUT");
}

function statusCheckItem(checkItemID, cStatus) {
  let setUrl = `https://api.trello.com/1/cards/${cardId}/checkItem/${checkItemID}?state=${cStatus}&${keyUrl}&${tokenUrl}`;
  return fetchUtil(setUrl, "PUT");
}

function setEventItemDelButton(btn, listID, itemID) {
  btn.on('click', () => {
    delCheckItem(listID, itemID).then(() => {
      $(`div[data-listItemID = ${itemID}]`).hide("slow", () => { $(this).remove(); });
    });
  });
}

function setItemEvents(statusBtn, nameSpan, itemDelBtn, item, checkListID) {

  nameSpan.on('dblclick', (event) => {
    var itemid = $(event.target).attr("data-listitemid");
    var value = $(event.target).text();
    $(event.target).html(getForm(itemid, "change-item-name", "Enter-New-Name", "➤"));
    var input = $(`.editable[data-listitemid = "${itemid}"] input[data-checklistid = "${itemid}"]`);
    input.val(value);
    itemDelBtn.off('click');
    itemDelBtn.on('click', () => {
      $(event.target).html(value);
      setEventItemDelButton(itemDelBtn, checkListID, item["id"]);
    });
    $(`.change-item-name[data-checklistid = "${itemid}"]`).on('submit', (event) => {
      event.preventDefault();
      renameCheckItem(itemid, input.val())
        .then(() => {
          nameSpan.html(`${input.val()}`);
        });
    });
  });

  statusBtn.on('click', () => {
    if (statusBtn.attr("data-status") == "complete") {
      statusCheckItem(statusBtn.attr("data-listitemid"), "incomplete")
        .then(() => {
          nameSpan.css({
            "text-decoration": "none",
          });
          statusBtn.removeClass("btn-outline-success");
          statusBtn.addClass("btn-outline-danger").val("✗");
          statusBtn.attr("data-status", "incomplete");
        });
    } else {
      statusCheckItem(statusBtn.attr("data-listitemid"), "complete")
        .then(() => {
          nameSpan.css({
            "text-decoration": "line-through",
            "text-decoration-color": "green",
          });
          statusBtn.removeClass("btn-outline-danger");
          statusBtn.addClass("btn-outline-success").val("✓");
          statusBtn.attr("data-status", "complete");
        });
    }
  });

  setEventItemDelButton(itemDelBtn, checkListID, item["id"]);
}

function createItemElements(item, checkListID) {
  let statusBtn = $("<input>")
    .attr({
      class: "status btn btn-sm",
      type: "button",
      "data-listitemid": `${item["id"]}`,
      "data-status": `${item["state"]}`,
    });

  let nameSpan = $("<span>")
    .attr({
      class: "editable d-flex align-items-center",
      "data-checklistid": `${checkListID}`,
      "data-listitemid": `${item["id"]}`,
    })
    .append(`${item["name"]}`);

  let itemDelBtn = $('<button>').attr({
    class: "close",
    "data-toDeleteID": `${item["id"]}`,
  }).text('x');

  var child = $('<div>')
    .attr({
      class: "card",
      "data-listItemID": `${item["id"]}`,
    })
    .append(
      $("<div>")
        .attr({
          class: "card-body d-flex justify-content-between",
        })
        .append(statusBtn, nameSpan, itemDelBtn)
    )

  if (item["state"] == "complete") {
    nameSpan.css({
      "text-decoration": "line-through",
      "text-decoration-color": "green",
    });
    statusBtn.addClass("btn-outline-success").val("✓");
  } else {
    statusBtn.addClass("btn-outline-danger").val("✗");
  }

  setItemEvents(statusBtn, nameSpan, itemDelBtn, item, checkListID);

  return child;
};

function displayListItem(item, checkListID) {
  let child = createItemElements(item, checkListID);
  return child;
}

function setEventDelButton(btn) {
  btn.on('click', () => {
    var toDeleteID = btn.attr("data-toDeleteID");
    delCheckList(toDeleteID).then(() => {
      $(`div[data-checkListID = ${toDeleteID}]`).fadeOut(600, () => { $(this).remove(); });
    });
  });
}

function createListElements(list) {
  var delBtn = $('<button>').attr({
    class: "close text-white",
    "data-toDeleteID": `${list["id"]}`,
  }).text('X');

  var parent = $('<div>').attr({
    class: "card border-dark text-center mt-3",
    "data-checkListID": `${list["id"]}`,
  })
    .append(
      $('<div>')
        .attr({ class: "card-header text-white bg-dark" })
        .append(
          (
            $("<span>")
              .attr({
                class: "changeable h5",
                "data-checklistid": `${list["id"]}`,
              })
              .append(
                `${list["name"]}`,
              )
          ),
          delBtn,
        ),
      getForm(list["id"], "add-item", "Add-New-List-Item", "＋"),
    )

  list["checkItems"].forEach(item => {
    let child = displayListItem(item, `${list["id"]}`);
    parent.append(child);
  });

  setEventDelButton(delBtn);

  return parent;
}

function setListEvents(parent, list) {

  $(`.add-item[data-checkListID = ${list["id"]}]`).on('submit', (event) => {
    event.preventDefault();
    var itemName = $(`.new-item[data-checkListID = ${list["id"]}]`).val();
    postCheckItem(`${list["id"]}`, itemName)
      .then(item => (displayListItem(item, `${list["id"]}`)))
      .then(child => parent.append(child));
    $(`.new-item[data-checkListID = ${list["id"]}]`).val('');
  });

  $(`.changeable[data-checklistid = "${list["id"]}"]`).on('dblclick', (event) => {
    var value = $(event.target).text();
    var delBtn = $(`button[data-toDeleteID = "${list["id"]}"]`);
    $(event.target).html(getForm(list["id"], "change-name", "Enter-New-Name", "➤"));
    var input = $(`.change-name input[data-checklistid = "${list["id"]}"]`);
    input.val(value);
    delBtn.off('click');
    delBtn.on('click', () => {
      $(event.target).html(value);
      setEventDelButton(delBtn);
    });
    $(`.change-name[data-checklistid = "${list["id"]}"]`).on('submit', (event) => {
      event.preventDefault();
      renameCheckList(`${list["id"]}`, input.val())
        .then(() => {
          $(`.changeable[data-checklistid = "${list["id"]}"]`).html(`${input.val()}`);
        });
    });
  });
}

function displayCheckList(list) {

  let parent = createListElements(list);
  $("#container-card").append(parent);
  setListEvents(parent, list);

}

$(() => {
  getCheckLists()
    .then(jsonData => {
      jsonData.forEach(element => {
        displayCheckList(element);
      });
    });

  $("#add-list").on('submit', (event) => {
    event.preventDefault();
    var checkListName = $("#new-list").val();
    postCheckList(checkListName)
      .then(list => (displayCheckList(list)));
    $("#new-list").val('');
  });

});
