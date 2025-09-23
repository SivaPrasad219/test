<template>
  <div class="container">
    <a-spin :spinning="isSpinLoading">
      <div class="headerPanel">
        <div class="topHeaderpanel">
          <h2 class="titlePanel">
            {{ t("devicePage.LIMS Formatter", "LIMS Formatter") }}
          </h2>
          <a-button class="backBtn" @click="backToMeasurePopup">{{
            t("devicePage.Back", "Back")
          }}</a-button>
        </div>
        <div class="topHeaderpanel">
          <div class="Panel">
            <div class="Paneltitle">
              <h3 class="titlePanel">
                {{ t("devicePage.Data Panel", "Data Panel") }}
              </h3>
              <a-popover placement="topLeft">
                <template #content>
                  <span
                    >This panel displays Measurement and instrument data</span
                  >
                </template>
                <a-icon type="info-circle" theme="outline"></a-icon>
              </a-popover>
            </div>
            <div class="left-xmlpanel">
              <JsonPanelComponent
                v-if="xmlData"
                class="left-panel"
                :jsonData="xmlData"
              ></JsonPanelComponent>
            </div>
          </div>
          <div class="Panel" style="margin-left: 10px">
            <div class="Paneltitle">
              <h3 class="titlePanel">
                {{ t("devicePage.Tree-node Panel", "Tree-node Panel") }}
              </h3>
              <a-popover placement="topLeft">
                <template #content>
                  <span
                    >This panel displays JSON tree-node format, and it is
                    editable (only Labels).</span
                  >
                </template>
                <a-icon type="info-circle" theme="outline"></a-icon>
              </a-popover>
            </div>
            <div v-if="xmlData" class="tree-node-panel">
              <TreeNodePanelComponent
                ref="treeNodePanelRef"
                class="right-panel"
                :jsonData="xmlData"
                @jsonEdited="onJsonEdited"
                @changedKeys="onChangedKeys"
                @clearChangedKeys="clearChangedKeys"
              ></TreeNodePanelComponent>
            </div>
          </div>
        </div>
      </div>

      <div class="tableBottom" style="margin-top: 2rem">
        <a-tabs
          :default-active-key="String(selectedTabIndex)"
          @change="onTabSelected"
          class="bottom-panel"
        >
          <a-tab-pane key="0" tab="XML">
            <div v-if="selectedTabIndex === 0" class="previewData xml-tree">
              <pre>{{ getConvertedXml() }}</pre>
            </div>
          </a-tab-pane>
          <a-tab-pane key="1" tab="JSON">
            <div v-if="selectedTabIndex === 1" class="previewData">
              <pre>{{ getConvertedJson("json") }}</pre>
            </div>
          </a-tab-pane>
          <!-- <a-tab-pane key="2" tab="PDF" style="width: 100vw; height: 10vh"> -->

          <a-tab-pane key="2" tab="PDF" style="width: 100vw; height: 10vh">
            <div
              v-if="selectedTabIndex === 2 && pdfContent"
              class="previewData"
            >
              <vue-pdfjs-wrapper
                :pdf-src="pdfContent"
                :scale="true"
                :is-render-text="true"
                :original-size="false"
                style="width: 1055px; height: 100%"
              />
            </div>
          </a-tab-pane>
          <a-tab-pane key="3" tab="CSV">
            <div
              v-if="selectedTabIndex === 3"
              class="previewData csv-table-container"
            >
              <table class="csv-table">
                <thead>
                  <tr>
                    <th style="width: 200px; border: 1px solid black">Key</th>
                    <th style="border: 1px solid black">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in editedJsonArray" :key="item.key">
                    <td style="border: 1px solid black">{{ item.key }}</td>
                    <td style="border: 1px solid black">{{ item.value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </a-tab-pane>
          <template #rightExtra>
            <div class="download-button-container">
              <a-button
                v-if="userRole === 'administrator'"
                type="primary"
                @click="submitLimsToJM"
                style="margin-right: 1rem"
                >{{ t("devicePage.Submit", "Submit") }}</a-button
              >
              <a-button type="primary" @click="downloadContent">{{
                t("devicePage.Export", "Export")
              }}</a-button>
            </div>
          </template>
        </a-tabs>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from "vue";
import "moment-timezone";
import { notification } from "ant-design-vue";
import { fetchLimsDataFromAPI } from "../services/apiService";
import { Spin, Tabs } from "ant-design-vue";
import { TreeService } from "../services/treeService";
import { apcApiServices } from "../deviceTypes/apc/services/apcService";
import { exportAuditForLimsEditor } from "../services/apiService";
import JsonPanelComponent from "../components/JsonPanelComponent.vue";
import TreeNodePanelComponent from "@/components/TreeNodePanelComponent.vue";
import { fileFormatConversionService } from "../services/fileFormatConvertorService";
import { useRoute } from "vue-router";
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";
import VuePdfjsWrapper from "vue-pdfjs-wrapper";
import router from "@/router";
import { useI18n } from "vue-i18n";

import { convertAndFormatTimeUtc, formatTimeToSeconds } from "@/common/utils";
const apcService = new apcApiServices();
interface EditedJsonEntry {
  key: string;
  value: any;
}

export default defineComponent({
  name: "LimsEditorJobView",
  components: {
    "a-spin": Spin,
    "a-tabs": Tabs,
    "a-tab-pane": Tabs.TabPane,
    JsonPanelComponent,
    TreeNodePanelComponent,
    // PdfViewer,
    VuePdfjsWrapper,
  },
  setup() {
    let isSpinLoading = ref(false);
    let rawXmlData = ref<any>(null);
    let xmlData: any = ref(null);
    let treeNode = ref<any>(null);
    let selectedTabIndex = ref(0);
    let pdfContent: Ref<string | null> = ref(null);
    let editedJson = ref<EditedJsonEntry[]>([]);
    let format = ref("");
    let editedJsonArray = ref<any>([]);
    let decodedTokenString: Ref<string | null> = ref(null);
    let finalDownloadableData: Ref<string | null> = ref(null);
    const { t } = useI18n();
    const route = useRoute();
    const JM_API_URL = process.env.VUE_APP_JM_API_URL;
    const recordId = ref(route.params.id as string);
    let userRole = ref("");
    let message = "";
    const changedKeysData = ref<Array<Record<string, string>>>([]);
    const treeNodePanelRef = ref<InstanceType<
      typeof TreeNodePanelComponent
    > | null>(null);

    const translateKeysPerLanguage = (key: string) => {
      // Using the translation function to translate the key
      return t(`dataPage.${key}`, key); // Default to the original key if translation is missing
    };

    onMounted(() => {
      decodedTokenString.value = localStorage.getItem("DecodedToken");
      if (decodedTokenString.value) {
        const decodedToken = JSON.parse(decodedTokenString.value);
        userRole.value = decodedToken.role;
      }
      getXmlData();
    });
    const getXmlData = async () => {
      let url = `${JM_API_URL}/jm/lims-sample/${recordId.value}`;
      try {
        let response;
        try {
          response = await fetchLimsDataFromAPI(url, "GET", {});
          console.log("getXmlData", response);
        } catch (err) {
          console.log("some error occured for dummy data");
        }
        if (response) {
          let responseData = response[0].data.data;
          rawXmlData.value = response[0];
          let responseMetaData = response[0];
          let xmlResponseData: any = {};

          // Measurement Data
          let measurementData: any = {};
          let deviceInfo: any = {};
          let cummulativeData: any = {};
          let differentialData: any = {};
          // let measureSiteTimeZone = "";
          if (responseData) {
            if (responseData.volume) {
              measurementData["Volume"] =
                responseData?.volume?.value && responseData?.volume?.unit
                  ? responseData.volume.value + " " + responseData.volume.unit
                  : "";
            } else measurementData["Volume"] = "-";
            measurementData["Sample_Status"] = responseMetaData.status || "-";
            measurementData["Period"] = formatTimeToSeconds(
              responseData?.period
            );
          }
          if (responseMetaData?.meta) {
            measurementData["Sample_Type"] =
              responseMetaData.meta?.sample_type || "-";
            measurementData["User"] = responseMetaData.meta?.operator || "-";

            deviceInfo["Serial_Number"] =
              responseMetaData.meta?.asset_info?.asset_id || "-";
            deviceInfo["Device_Name"] =
              responseMetaData.meta?.asset_info?.name || "-";
            deviceInfo["Model"] =
              responseMetaData.meta?.asset_info?.model_info.name || "-";
            // measureSiteTimeZone =
            //   responseMetaData.meta?.asset_info?.site_info?.site_timezone ||
            localStorage.getItem("timeZone");
          }
          let timezone =
            responseMetaData.meta?.asset_info?.site_info?.site_timezone ||
            "UTC";
          if (response[0]?.measure_start_time) {
            measurementData.Measure_Start_Time = convertAndFormatTimeUtc(
              response[0]?.measure_start_time,
              timezone
            );
          }
          if (response[0]?.measure_end_time) {
            measurementData.Measure_End_Time = convertAndFormatTimeUtc(
              response[0]?.measure_end_time,
              timezone
            );
          }
          measurementData["Sample_ID"] = responseMetaData.task_result_id;
          xmlResponseData["Measurement_Data"] = measurementData;
          // Cummulative data
          if (responseData?.cumulative_data) {
            // let cumulativeDataArray =
            //   responseData.device_info.sampledata.cumulativedata;
            // for (const item of cumulativeDataArray) {
            //   const key = Object.keys(item)[0];
            //   const transformedKey = getValidXmlKeyName(key);
            //   const value = item[key];
            //   cummulativeData[transformedKey] = value;
            // }

            cummulativeData = responseData?.cumulative_data;
            console.log("xmlResponseData", cummulativeData);
          }
          xmlResponseData["Cumulative_Data"] = cummulativeData;
          // Differential data
          if (responseData?.differential_data) {
            // let differentialDataArray = responseData.differential_data;
            // for (const item of differentialDataArray) {
            //   const key = Object.keys(item)[0];
            //   const transformedKey = getValidXmlKeyName(key);
            //   const value = item[key];
            //   differentialData[transformedKey] = value;
            // }
            differentialData = responseData?.differential_data;
            console.log("xmlResponseData", differentialData);
          }
          xmlResponseData["Differential_Data"] = differentialData;
          // Instrument info
          if (responseMetaData?.meta?.asset_info) {
            deviceInfo["Firmware"] =
              responseMetaData.meta.asset_info.info.firmware.version || "-";
            deviceInfo["Last_Calibration_Date"] =
              responseMetaData.meta.asset_info.info.calibration.last || "-";
            deviceInfo["Site_Name"] =
              responseMetaData.meta.asset_info.site_info.name || "-";
          }
          xmlResponseData["Instrument_Data"] = deviceInfo;
          xmlData.value = xmlResponseData;
          console.log("xmlData", typeof xmlData.value.end_time);

          // Set values and update state
          editedJson.value = xmlData.value;

          const treeService = new TreeService();
          treeNode.value = treeService.convertToTreeNode(xmlData.value);
          isSpinLoading.value = false;
          editedJsonArray.value = Object.entries(editedJson.value).map(
            ([key, value]): EditedJsonEntry => ({ key, value })
          );
          console.log("Edited Json Array", editedJsonArray.value);
        }
      } catch (error) {
        console.error("Error fetching XML data:", error);
      }
    };
    // const getValidXmlKeyName = (name: string): string => {
    //   if (typeof name !== "string") {
    //     name = String(name);
    //   }
    //   return name.replace(/\s+/g, "");
    // };

    const backToMeasurePopup = () => {
      router.push("/apc/lims");
    };
    const submitLimsToJM = async () => {
      if (treeNodePanelRef.value) {
        treeNodePanelRef.value.emitChangedKeys();
        const record: any = editedJson.value;
        const recordUID = rawXmlData.value["lims_sample_meta"]["analysis_id"];
        let finalPayload: any = {};
        // record["Differential_Data"] =
        //   typeof record["Differential_Data"] !== "string"
        //     ? JSON.stringify(record["Differential_Data"])
        //     : record["Differential_Data"];
        // record["Cumulative_Data"] =
        //   typeof record["Cumulative_Data"] !== "string"
        //     ? JSON.stringify(record["Cumulative_Data"])
        //     : record["Cumulative_Data"];
        // console.log("submitLimsToJMsubmitLimsToJM", record);
        const payload = {
          Result: record,
        };
        finalPayload["id"] = rawXmlData.value["id"];
        finalPayload["uid"] = recordUID;
        if (message) {
          finalPayload["comments"] = message;
        }
        finalPayload["payload"] = payload;
        console.log(finalPayload);

        try {
          const limsResponse = await apcService.submitLimsRecord(finalPayload);
          console.log("line 508", limsResponse);
          if (limsResponse.status == 500) {
            notification.error({
              message: `${t(
                "notificationPage.No matching data found",
                "No matching data found"
              )}`,
              description: `Something went wrong`,
            });
          } else {
            treeNodePanelRef.value.clearChangedKeys();
            router.push("/apc/lims");
          }
        } catch (error) {
          notification.error({
            message: `${t(
              "notificationPage.No matching data found",
              "No matching data found"
            )}`,
            description: `Something went wrong`,
          });
        }
      }
    };
    const onChangedKeys = async (
      newChangedKeys: Array<Record<string, string>>
    ) => {
      changedKeysData.value = newChangedKeys;
      message = constructChangeMessage(changedKeysData.value);
      return message;
    };

    const onJsonEdited = (editedJsonData: any) => {
      editedJson.value = editedJsonData;
      getConvertedJson(format.value);
      const rawEditedJson = editedJson.value;
      editedJsonArray.value = Object.entries(rawEditedJson).map(
        ([key, value]) => ({
          key,
          value:
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : value,
        })
      );

      console.log("Edited Received JSON:", editedJson.value);
    };
    // const onChangedKeys = (newChangedKeys: Array<Record<string, string>>) => {
    //   changedKeysData.value = newChangedKeys;
    //   console.log("changedKeysData", changedKeysData.value);
    //   const message = constructChangeMessage(changedKeysData.value);
    //   console.log("constructChangeMessage", message);
    // };
    const constructChangeMessage = (changes: any) => {
      const messages: string[] = [];
      for (const uid in changes) {
        const changeObject = changes[uid];
        for (const [key, value] of Object.entries(changeObject)) {
          messages.push(`from ${key} to ${value}`);
        }
      }
      if (messages.length === 0) {
        return "";
      }
      const lastMessage = messages.pop();
      if (messages.length === 0) {
        return `Changed value ${lastMessage}`;
      }
      return `Changed value ${messages.join(", ")} and ${lastMessage}`;
    };

    // const getCookie = (name: string) => {
    //   const cookies = document.cookie.split(";");
    //   for (let i = 0; i < cookies.length; i++) {
    //     console.log("getCookiegetCookie", cookies);
    //     const cookie = cookies[i].trim();
    //     if (cookie.startsWith(`${name}=`)) {
    //       return cookie.substring(name.length + 1);
    //     }
    //   }
    //   return null;
    // };

    const convertObjectToXml = (key: string, value: any): string => {
      const sanitizedKey = key.replace(/^(\d+)/, "_$1"); // Sanitize keys starting with numbers
      const translatedKey = sanitizedKey; // Translate the sanitized key

      if (typeof value === "object" && value !== null) {
        let xmlString = `<${translatedKey}>\n`;
        // Recurse through the nested object
        for (const [subKey, subValue] of Object.entries(value)) {
          xmlString += convertObjectToXml(subKey, subValue); // Recurse for nested objects
        }
        xmlString += `</${translatedKey}>\n`;
        return xmlString;
      } else {
        // For non-object values, just wrap the translated key with the value
        return `<${translatedKey}>${value}</${translatedKey}>\n`;
      }
    };

    const getConvertedXml = () => {
      if (!editedJson.value) {
        return "";
      }

      let xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>\n<root>\n`;

      // Iterate through the editedJson and translate each key before appending to XML
      for (const [key, value] of Object.entries(editedJson.value)) {
        const translatedKey = key; // Translate the key
        xmlContent += convertObjectToXml(translatedKey, value); // Use the translated key
      }

      xmlContent += `</root>`;
      finalDownloadableData.value = xmlContent;
      console.log("xml finalDownloadableData", finalDownloadableData);
      return xmlContent;
    };

    const getConvertedJson = (receivedformat: string): string => {
      format.value = receivedformat;
      switch (format.value) {
        case "xml":
          if (editedJson.value) {
            return fileFormatConversionService.jsonToXml(editedJson.value);
          }
          break;
        case "csv":
          if (editedJson.value) {
            let csvContent = `<html><head>
                <style>
                    table {
                        width: 100%;
                        table-layout: fixed;
                    }
                    td {
                        padding: 8px;
                        word-wrap: break-word;
                        border: 1px solid #ccc;
        
                    }
                    tr {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                </style></head><body><table>`;
            for (let [key, value] of Object.entries(editedJson)) {
              value = JSON.stringify(value);
              csvContent += `<tr><td style="width: 200px">${key}</td><td>${value}</td></tr>`;
            }
            csvContent += "</table></body></html>";
            finalDownloadableData.value = csvContent;
            return csvContent;
          }
          break;

        case "pdf":
          generatePdf(editedJson, pdfContent, finalDownloadableData);
          break;
        case "json":
          if (editedJson.value) {
            let jsonresult = fileFormatConversionService.jsonToString(
              editedJson.value
            );
            finalDownloadableData.value = jsonresult;
            return jsonresult;
          }
          break;
        default:
          if (editedJson.value) {
            return fileFormatConversionService.jsonToString(editedJson);
          }
      }
      return ""; // Return empty string if data is not available
    };

    const generatePdf = (
      editedJson: any,
      pdfContent: any,
      finalDownloadableData: any
    ) => {
      if (editedJson.value) {
        let htmlContent = `<html><head>
      <style>
        table {
          width: 100%;
          table-layout: fixed;
        }
        td {
          padding: 8px;
          word-wrap: break-word;
          border: 1px solid #ccc;
        }
        tr {
          background-color: #f2f2f2;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <table>`;

        for (let [key, value] of Object.entries(editedJson.value)) {
          const stringValue = JSON.stringify(value);
          htmlContent += `<tr><td style="width: 200px">${key}</td><td>${stringValue}</td></tr>`;
        }
        htmlContent += "</table></body></html>";

        finalDownloadableData.value = htmlContent;
        console.log(":::::::::htmlContent", htmlContent);

        html2pdf()
          .from(htmlContent)
          .toPdf()
          .output("blob")
          .then((pdfBlob: any) => {
            console.log("::::::pdfBlob", pdfBlob);
            let link = document.createElement("a");
            link.style.display = "none";
            const blobUrl = window.URL.createObjectURL(pdfBlob);
            pdfContent.value = blobUrl;
            console.log(":::::::::blobUrl", blobUrl);
            // link.href = blobUrl;

            document.body.appendChild(link);
            link.click();
          })
          .catch((error: any) => {
            console.error("Error generating PDF:", error);
          });
      }
    };

    const onTabSelected = (key: string): void => {
      selectedTabIndex.value = Number(key);
      if (Number(key) === 2) {
        getConvertedJson("pdf");
      }
    };

    const downloadContent = async () => {
      let exportFormat = "";
      if (treeNodePanelRef.value) {
        treeNodePanelRef.value.emitChangedKeys();
      }
      let content: any = finalDownloadableData.value;
      let fileName = "";
      let contentType: any;
      switch (selectedTabIndex.value) {
        case 0: // XML tab
          fileName = "data.xml";
          contentType = "application/xml";
          exportFormat = "xml";
          break;
        case 1: // JSON tab
          fileName = "data.json";
          contentType = "application/json";
          exportFormat = "json";
          break;
        case 2:
          html2pdf().from(finalDownloadableData.value).toPdf().save("data.pdf");
          exportFormat = "pdf";
          break;
        case 3: {
          let csvContent = `<html><head>
          <style>
              table {
                  width: 100%;
                  table-layout: fixed;
              }
              td {
                  padding: 8px;
                  word-wrap: break-word;
                  border: 1px solid #ccc;

              }
              tr {
                  background-color: #f2f2f2;
                  font-weight: bold;
              }
          </style></head><body><table>
         `;
          let csvRawValue: any = editedJson.value;
          for (let [key, value] of Object.entries(csvRawValue)) {
            value = JSON.stringify(value);
            console.log("valuevaluevaluevalue", value);
            csvContent += `<tr><td>${key}</td><td>${value}</td></tr>`;
          }
          csvContent += "</table></body></html>";
          finalDownloadableData.value = csvContent;
          const parser = new DOMParser();
          const doc = parser.parseFromString(
            finalDownloadableData.value,
            "text/html"
          );
          const rows = Array.from(doc.querySelectorAll("tr"));
          const csvFinalContent = rows
            .map((row) => {
              const columns = Array.from(row.querySelectorAll("td, th")).map(
                (cell) => {
                  const value = (cell.textContent ?? "").trim();
                  return `"${value.replace(/"/g, '""')}"`; // Encapsulate value within quotes and handle double quotes
                }
              );
              return columns.join(",");
            })
            .join("\n");

          let csvFileName = "data.csv";
          const blob = new Blob([csvFinalContent], {
            type: "text/csv;charset=utf-8;",
          });
          saveAs(blob, csvFileName);
          exportFormat = "csv";
          break;
        }
        default:
          // Handle other tabs if needed
          break;
      }
      let payload: any = {};
      let comments = `Exported Lims Editor Page In ${exportFormat} format`;
      if (message) {
        comments += `, ${message}`;
      }
      let siteToken: any = decodedTokenString.value;
      let site_info: any = {};
      if (siteToken !== null) {
        if (typeof siteToken === "string") {
          siteToken = JSON.parse(siteToken);
        }
        site_info.id = siteToken.site_id;
        site_info.name = siteToken.site;
        site_info.site_timezone = siteToken.site_timezone;
      }
      payload["comments"] = comments;
      payload["site_info"] = site_info;
      await exportAuditForLimsEditor(payload);
      if (content && contentType) {
        const blob = new Blob([content], { type: contentType });
        saveAs(blob, fileName);
      }
    };

    return {
      isSpinLoading,
      rawXmlData,
      xmlData,
      treeNode,
      selectedTabIndex,
      pdfContent,
      editedJson,
      format,
      editedJsonArray,
      finalDownloadableData,
      backToMeasurePopup,
      userRole,
      // submitLims,
      submitLimsToJM,
      onJsonEdited,
      getConvertedXml,
      getConvertedJson,
      onTabSelected,
      downloadContent,
      generatePdf,
      onChangedKeys,
      treeNodePanelRef,
      t,
      translateKeysPerLanguage,
    };
  },
});
</script>

<style scoped>
.container {
  /* display: flex; */
  height: 90vh;
  font-size: 12px;
  justify-content: space-between;
  margin-bottom: 5px;
}

.left-panel,
.right-panel {
  flex: 1;
  height: 50vh;
  overflow-y: auto;
  background-color: white;
}

.bottom-panel {
  width: 100%;
  margin-top: 20px;
}

.csv-table-container {
  overflow-x: auto;
}

.csv-table {
  border-collapse: collapse;
  width: 100%;
}

.csv-table th,
.csv-table td {
  padding: 8px;
  border: 1px solid black;
}
.left-xmlpanel,
.tree-node-panel {
  overflow-y: auto;
  font-size: 12px;
  /* height: 55vh; */
}
.titlePanel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.left-panel {
  color: #808988;
}
.Panel {
  width: 49%;
  font-size: 12px;
  background-color: white;
  border-radius: 4px;
  /* display: inline-block; */
  min-height: 50vh;
  padding-bottom: 1rem;
}
.info-icon {
  margin-left: 10px;
}
.previewData {
  height: 30vh;
  overflow-y: auto;
  background-color: white;
}
.tableBottom {
  background-color: white;
}
.xml-tree {
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.xml-tree pre {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
  overflow-x: auto;
  max-width: 100%;
  min-height: 100%;
}

.xml-tree pre::before {
  content: " ";
  display: block;
  height: 100%; /* force line break */
}

.xml-tree pre code {
  display: block;
  padding-left: 20px;
}

.xml-tree pre code span {
  display: block;
}

.xml-tree pre code span:before {
  content: "│";
  position: absolute;
  left: 0;
}

.xml-tree pre code span:last-child:before {
  content: "└";
}

.xml-tree pre code span.branch:before {
  content: "├";
}

.xml-tree pre code span.leaf:before {
  content: " ";
}
hr {
  /* border: none;  */
  /* height: 1px;  */
  background-color: gray !important;
}
::ng-deep .ant-tabs-bar {
  margin: 0 !important;
}
.backBtn {
  width: 100px !important;
}
.topHeaderpanel {
  display: flex;
  justify-content: space-between;
}
.Paneltitle {
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

::v-deep .ant-input-group > .ant-input:last-child,
.ant-input-group-addon:last-child {
  background: #1890ff;
  color: #ffffff;
}
.download-button-container {
  text-align: right;
  margin-bottom: 5px;
  margin-right: 12px;
}

::v-deep .pdf-canvas-layer {
  width: 1055px !important;
}

::v-deep .ant-tabs-nav-wrap {
  padding: 0 20px !important;
}
</style>
