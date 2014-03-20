define(function() {

  function CtxMenusService(core) {
      /***************************************
      /* Right click context menus.

      Being able to exchange an identity over a public medium (say a forum or email)
      is useful if you want to setup a multisig account or start an encrypted
      commnunication chanel.

      In the future we could even have options to paste special data which can
      be recognised or loaded by other wallets. i.e you make a pledge and people
      sign inputs posting the results one after another on a forum.
       */
      function importIdentity(info) {
      }
      function pasteIdentity(info) {
      /*
          //var focus = document.activeElement;
          var focus = focus.getElementsByTagName("textarea")[0];
          var text = "my_identity is genjix!!";
          if (focus.tagName.toLowerCase() == "input" ||
              focus.tagName.toLowerCase() == "textarea")
          {
      		// Get start and end position of caret
      		var startPos = focus.selectionStart;
      		var endPos = focus.selectionEnd;
      
      		// insert text
      		focus.value = focus.value.substring(0, startPos) + text +
			focus.value.substring(endPos, focus.value.length);

		// update caret position
		focus.setSelectionRange(startPos + text.length, startPos + text.length);
          }
      */
      }
      chrome.contextMenus.create({
          title: "Import identity",
          contexts: ["selection"],
          onclick: importIdentity
      });
      chrome.contextMenus.create({
          title: "Paste identity",
          contexts: ["editable"],
          onclick: pasteIdentity
      });
  }
  return CtxMenusService;

});
