function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (e.parameter.action === 'list') {
    var list = [];
    for (var i = 1; i < data.length; i++) {
      list.push({
        leaveId: data[i][0],
        patientName: data[i][5],
        createdAt: data[i][12]
      });
    }
    return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
  }

  if (!e.parameter.leaveId) return ContentService.createTextOutput("Error: No ID").setMimeType(ContentService.MimeType.TEXT);
  
  var leaveId = e.parameter.leaveId.toString().toUpperCase();
  var result = null;

  // Search backwards to get the most recent entry for this ID
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] && data[i][0].toString().toUpperCase() == leaveId) {
      result = {
        leaveId: data[i][0] ? data[i][0].toString() : "",
        duration: data[i][1] ? data[i][1].toString() : "",
        admissionDate: data[i][2] ? data[i][2].toString() : "",
        dischargeDate: data[i][3] ? data[i][3].toString() : "",
        issueDate: data[i][4] ? data[i][4].toString() : "",
        patientName: data[i][5] ? data[i][5].toString() : "",
        nationalId: data[i][6] ? data[i][6].toString() : "",
        nationality: data[i][7] ? data[i][7].toString() : "",
        employer: data[i][8] ? data[i][8].toString() : "",
        practitionerName: data[i][9] ? data[i][9].toString() : "",
        position: data[i][10] ? data[i][10].toString() : "",
        hospitalName: data[i][11] ? data[i][11].toString() : "",
        createdAt: data[i][12] ? data[i][12].toString() : ""
      };
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.leaveId,         // 0
    data.duration,        // 1
    data.admissionDate,   // 2
    data.dischargeDate,   // 3
    data.issueDate,       // 4
    data.patientName,     // 5
    data.nationalId,      // 6
    data.nationality,     // 7
    data.employer,        // 8
    data.practitionerName,// 9
    data.position,        // 10
    data.hospitalName,    // 11
    data.createdAt        // 12
  ]);
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
