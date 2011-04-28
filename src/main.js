var SIGNED_IN_BADGE_COLOR_ = {color: [208, 0, 24, 255]};
var SIGNED_PROCESS_BADGE_COLOR_ = {color: [208, 0, 24, 255]};

var DISPLAY_DEFAULT    = 'window';
var WIDTH_DEFAULT      = '200';
var HEIGHT_DEFAULT     = '300';
var COUNT_DEFAULT      = 'all';
var LISTS_DEFAULT      = 'all';
var INTERVAL_DEFAULT   = 60;
var APPS_URL_DEFAULT   = '';
var URL_DEFAULT        = 'https://mail.google.com/tasks/';
var CANVUS_URL_DEFAULT = 'https://mail.google.com/tasks/canvas';
var VIEW_DEFAULT       = 'ig';

function updateTask() {
  //chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 255]});
  //chrome.browserAction.setBadgeText({text: '...'});
  
  var today = new Date;
  yy = today.getYear();
  mm = today.getMonth() + 1;
  dd = today.getDate();
  if (yy < 2000) { yy += 1900; };
  if (mm < 10)   { mm = '0' + mm; };
  if (dd < 10)   { dd = '0' + dd; };
  
  var today_ymd = yy.toString() + mm.toString() + dd.toString();
  var count        = localStorage.getItem('org.7kai.chrome.tasks.count')        || COUNT_DEFAULT;
  var count_lists  = localStorage.getItem('org.7kai.chrome.tasks.lists')        || LISTS_DEFAULT;
  var apps_url     = localStorage.getItem('org.7kai.chrome.tasks.apps_url')     || APPS_URL_DEFAULT;
  var url = 'https://mail.google.com/tasks/ig';
  if (apps_url.length > 0) {
    url = 'http://mail.google.com/tasks/a/' + apps_url + '/ig';
  }
  var d_url = 'https://mail.google.com/tasks/r/d';
  if (apps_url.length > 0) {
    d_url = 'http://mail.google.com/tasks/a/' + apps_url + '/r/d';
  }
  
  var countText = 0;
  var lists = new Array();
  var failure = false;
  
  $.ajax({
    type: 'GET',
    url: url,
    data: null,
    dataType: 'html',
    async: false,
    success: function(html) {
      if (html.match(/_setup\((.*)\)\}/)) {
        var data = eval('(' + RegExp.$1 + ')');
        
        $.each(data.t.lists, function (i, val) {
          if (i > 0) { lists.push(val) }
        });
        
        $.each(data.t.tasks, function (i, val) {
          if (
            val.completed == false &&
            val.name.length > 0 &&
            (
              count == 'all' ||
              ( count == 'today' && val.task_date == today_ymd ) ||
              ( count == 'former' && parseInt(val.task_date) <= parseInt(today_ymd) )
            )
          ) {
            countText = countText + 1;
          }
        })
      } else {
        failure = true;
      }
    }
  });
  
  if (failure) {
    chrome.browserAction.setBadgeText({text: 'X'});
    return ;
  }
  
  // lists
  if (count_lists == 'all') {
    for (var i = 0; i < lists.length; i = i + 1) {
      var list = lists[i];
      $.ajax({
        type: 'POST',
        url: d_url,
        data: {'r': '{"action_list":[{"action_type":"get_all","action_id":"1","list_id":"' + list.id + '","get_deleted":false}],"client_version":12743913}'},
        dataType: 'json',
        async: false,
        beforeSend : function(xhr){
          xhr.setRequestHeader('AT', '1');
        },
        success: function(data) {
          
          $.each(data.tasks, function (i, val) {
            
            if (
              val.completed == false &&
              val.name.length > 0 &&
              (
                count == 'all' ||
                ( count == 'today' && val.task_date == today_ymd ) ||
                ( count == 'former' && parseInt(val.task_date) <= parseInt(today_ymd) )
              )
            ) {
              countText = countText + 1;
            }
          })
        }
      });
    }
  }
  
  if (countText > 0) {
    chrome.browserAction.setBadgeBackgroundColor(SIGNED_IN_BADGE_COLOR_);
    chrome.browserAction.setBadgeText({text: countText.toString()});
  } else {
    chrome.browserAction.setBadgeText({text: ''});
  }
}
