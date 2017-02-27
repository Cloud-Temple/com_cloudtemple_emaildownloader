function com_cloudtemple_emaildownloader_HandlerObject() {
}

com_cloudtemple_emaildownloader_HandlerObject.prototype = new ZmZimletBase();
com_cloudtemple_emaildownloader_HandlerObject.prototype.constructor = com_cloudtemple_emaildownloader_HandlerObject;

var EmailDownloaderZimlet = com_cloudtemple_emaildownloader_HandlerObject;

EmailDownloaderZimlet.prototype.doubleClicked = function(){this.singleClicked();};
EmailDownloaderZimlet.prototype.singleClicked = function(){
  var dialog = appCtxt.getMsgDialog();
  dialog.reset();
  dialog.setMessage(this.getMessage("EmailDownloaderZimlet_panel_tooltip"), DwtMessageDialog.INFO_STYLE);
  dialog.popup();
};

EmailDownloaderZimlet.prototype.doDrop =
function(droppedItem) {
  var ids = [];
  var msgObjs = [];
  var fmt = "zip";
  var path = "";
  var type = "";
  var exportFileName = "";

  if(droppedItem instanceof Array) {
    for(var i =0; i < droppedItem.length; i++) {
      var obj = droppedItem[i].srcObj ?  droppedItem[i].srcObj :  droppedItem[i];

      if(obj.type == "CONV") {
        ids = ids.concat(this._getMsgIdsFromConv(obj));
      } else if(obj.type == "MSG") {
        ids.push(obj.id);
      } else if(obj.TYPE == "ZmContact") {
        ids.push(obj.id);
      } else if(obj.TYPE == "ZmAppt" || obj.type == "APPT") {
        ids.push(obj.id);
      } else if(obj.type == "TASK") {
        ids.push(obj.id);
      } else if(obj.type == "BRIEFCASE_ITEM"){
        ids.push(obj.id);
      }
    }
  } else {
    var obj = droppedItem.srcObj ? droppedItem.srcObj : droppedItem;

    if(obj.children && this._emptyFolders(obj) && obj.type != "TAG") {
      appCtxt.getAppController().setStatusMsg(this.getMessage("EmailDownloaderZimlet_dir") + " " + obj.name + " " + this.getMessage("empty_folder"), DwtMessageDialog.WARNING_STYLE);
      return;
    }

    if (obj.type == "CONV"){
      ids = this._getMsgIdsFromConv(obj);
    } else if(obj.type == "MSG") {
      ids.push(obj.id);
    } else if(obj.TYPE == "ZmContact") {
      ids.push(obj.id);
      fmt = "vcf";
    } else if(obj.TYPE == "ZmAppt" || obj.type == "APPT") {
      ids.push(obj.id);
      fmt = "ics";
    } else if(obj.type == "FOLDER" || obj.type == "ADDRBOOK" || obj.type == "BRIEFCASE") {
      var rootPath = obj.path ? obj.path : '';
      path = rootPath + "/" + obj.name;
    } else if(obj.type == "CALENDAR") {
      fmt = "ics";
      path = obj.name == 'Calendrier' ? 'Calendar' : obj.name; 
    } else if(obj.type == "TASK") {
      type = "task";
      path = obj.name;
    } else if(obj.type == "BRIEFCASE_ITEM") {
      ids.push(obj.id);
    } else if(obj.type == 'TAG') {
      appCtxt.getAppController().setStatusMsg(this.getMessage("EmailDownloaderZimlet_noTag"),ZmStatusView.LEVEL_CRITICAL);
      return;
    }
  }

  var url = [];
  var i = 0;
  var proto = location.protocol;
  var port = Number(location.port);
  var date = new Date();

  url[i++] = proto;
  url[i++] = "//";
  url[i++] = location.hostname;
  if (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
        || (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT))) {
          url[i++] = ":";
          url[i++] = port;
        }
  url[i++] = "/home/";
  url[i++] = AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name);
  url[i++] = "/";
  url[i++] = encodeURIComponent(path);
  url[i++] = "?fmt=";
  url[i++] = fmt;
  url[i++] = "&type=";
  url[i++] = type;
  url[i++] = "&list=";
  url[i++] = ids.join(",");
  url[i++] = "&filename=export_" + date.toISOString().slice(0, 10) + 'T' + date.toTimeString().slice(0,5);

  var getUrl = url.join("");
  window.open(getUrl);
};

EmailDownloaderZimlet.prototype._getMsgIdsFromConv = function(convSrcObj) {
  convSrcObj.load();
  return  convSrcObj.msgIds;
};

EmailDownloaderZimlet.prototype._emptyFolders = function(obj) {
  var children = obj.children._array;
  if (obj.numTotal == 0 && children.length == 0) {
    return true;
  } else {
    if(obj.numTotal > 0){ return false; }
    var emptyChildren = true;
    for(var i = 0; i < children.length; i++){
      emptyChildren = this._emptyFolders(children[i]);
      if(!emptyChildren){ return false; }
    }
    return true;
  }
}

EmailDownloaderZimlet.prototype.initializeToolbar = function(app, toolbar, controller, viewId) {
  var buttonIndex = 0;
  if (viewId.match(/^(CLV|TV)-SR/) != null) {
    for (var i = 0; i < toolbar.opList.length; i++) {
      if (toolbar.opList[i] == ZmOperation.ACTIONS_MENU) {
        buttonIndex = i + 1;
        break;
      }
    }
    var backupButton = toolbar.getButton("EMAIL_DOWNLOADER");
    if (!backupButton) {
      var button = toolbar.createOp("EMAIL_DOWNLOADER", {
        text: this.getMessage("EmailDownloaderZimlet_toolbar_button"),
        tooltip: this.getMessage("EmailDownloaderZimlet_panel_tooltip"),
        index: buttonIndex });
      button.addSelectionListener(new AjxListener(this, this.exportItems, [controller]));
    }
    controller.operationsToEnableOnMultiSelection.push("EMAIL_DOWNLOADER");
    toolbar.getButton("EMAIL_DOWNLOADER").setEnabled(false);
  }
}

EmailDownloaderZimlet.prototype.exportItems = function(controller) {
  var selectedItems = controller.getSelection();
  this.doDrop(selectedItems);
}
