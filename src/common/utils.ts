import moment from "moment-timezone";
import { useI18n } from "vue-i18n";
export interface Task {
  fields?: string[];
  tasks?: Task[];
}

export const getTaskFields = (tasksData: Task[]): string[] => {
  const fields: string[] = [];

  for (const task of tasksData) {
    if (task.fields) {
      fields.push(...task.fields);
    } else if (task.tasks) {
      const nestedFields = getTaskFields(task.tasks);
      if (nestedFields.length > 0) {
        fields.push(...nestedFields);
      }
    }
  }

  return fields;
};
/**
 * Formats an ISO date string into a human-readable string with the specified time zone.
 * If no time zone is provided, it uses the time zone from the ISO string if available.
 * If the ISO string does not include a specific time zone and no time zone is provided, it formats the string without a time zone.
 *
 * @param isoString - The ISO date string to be formatted.
 * @param timeZone - (Optional) The time zone to convert the date to. If not provided, the original time zone from the ISO string is used if available.
 * @returns A formatted date string in the format "Month Day, Year, HH:MM:SS AM/PM (Full Time Zone Name - Abbreviation±Offset)" or without time zone information if not applicable.
 */
export const formatISODate = (isoString: string, timeZone?: string): string => {
  // Check if isoString is empty or invalid
  if (!isoString || isNaN(Date.parse(isoString))) {
    return "";
  }

  // Parse the date using moment
  let momentDate = moment(isoString);

  // Check if the ISO string includes a time zone offset
  const match = isoString.match(/([+-]\d{2}:\d{2}|Z)$/);

  if (!timeZone && !match) {
    // If no time zone provided and no specific time zone in ISO string, format without time zone
    const patternWithoutTZ = "MMM D, YYYY, h:mm:ss A";
    return momentDate.format(patternWithoutTZ);
  }

  // Determine the effective time zone
  let effectiveTimeZone: string | undefined;

  if (timeZone) {
    effectiveTimeZone = timeZone;
  } else if (match) {
    effectiveTimeZone = "UTC"; // Treat 'Z' as UTC or use the offset in the ISO string
  }

  if (effectiveTimeZone) {
    // Use moment-timezone to get the abbreviation and offset
    momentDate = momentDate.tz(effectiveTimeZone);
    const timeZoneAbbr = momentDate.format("z");

    // Determine the date format pattern
    const pattern = "MMM D, YYYY, h:mm:ss A";

    // Format the date
    let formattedDate = momentDate.format(pattern);
    if (timeZoneAbbr) {
      formattedDate += ` (${timeZoneAbbr})`;
    }

    return formattedDate;
  } else {
    // Fallback formatting without time zone
    const patternWithoutTZ = "MMM D, YYYY, h:mm:ss A";
    return momentDate.format(patternWithoutTZ);
  }
};

/* Example usage:

const isoString1 = '2024-05-15T19:25:12.095Z';
console.log(formatISODate(isoString1)); // Output: "May 15, 2024, 7:25:12 PM (Coordinated Universal Time - UTC+00:00)"

const isoString2 = '2024-05-15T19:25:12.095+05:30';
console.log(formatISODate(isoString2)); // Output: "May 16, 2024, 12:55:12 AM (India Standard Time - IST+05:30)"

const isoString3 = '2024-05-15T19:25:12.095-05:00';
console.log(formatISODate(isoString3)); // Output: "May 15, 2024, 2:25:12 PM (Eastern Standard Time - EST-05:00)"

const isoString4 = '2024-05-15T19:25:12.095';
console.log(formatISODate(isoString4)); // Output: "May 15, 2024, 7:25:12 PM"

const invalidIsoString = 'invalid-date';
console.log(formatISODate(invalidIsoString)); // Output: ""

const emptyIsoString = '';
console.log(formatISODate(emptyIsoString)); // Output: ""

*/

// Show time as it is as the record time in DB. eg: measure start time

export const formatMeasureTime = (
  isoString: string,
  timeZone: string
): string => {
  try {
    if (isoString && isoString !== "-") {
      const utcTime = moment.utc(isoString);
      const utcFormattedTime = utcTime.format("MMM DD, YYYY, h:mm:ss A");
      const measureTimezoneAbbr = utcTime.tz(timeZone).format("z");
      // console.log(utcFormattedTime + ` (${measureTimezoneAbbr})`);
      return utcFormattedTime + ` (${measureTimezoneAbbr})`;
    } else return "-";
  } catch (err) {
    console.error("Error formatting time:", err);
    return "-";
  }
};

export const lastCalibrationTime = (isoString: string): string => {
  try {
    if (isoString && isoString !== "-") {
      const utcTime = moment.utc(isoString);
      return utcTime.format("MMM DD, YYYY");
    } else return "-";
  } catch (err) {
    console.error("Error formatting time:", err);
    return "-";
  }
};

export const getFormattedTime = (time: any, timezone?: string): string => {
  // Handle object format with time and timeZone properties
  if (typeof time === "object" && time !== null && time.time) {
    const dateTime = time.time;
    const tz = time.timeZone || timezone;

    if (!dateTime) {
      return "-";
    }

    const date = moment(
      dateTime,
      ["MM/DD/YYYY", "YYYY-MM-DD", "YYYY/MM/DD", moment.ISO_8601],
      true
    );
    if (!date.isValid()) {
      return "-";
    }

    if (tz) {
      // Format with time included and timezone abbreviation
      const formatted = moment.utc(dateTime).tz(tz);
      return (
        formatted.format("MMM D, YYYY, h:mm:ss A") +
        " (" +
        formatted.format("z") +
        ")"
      );
    }
    return moment.utc(dateTime).format("MMM D, YYYY, h:mm:ss A");
  }

  // Handle simple time value (backward compatibility)
  if (!time) {
    return "-";
  }
  const date = moment(
    time,
    ["MM/DD/YYYY", "YYYY-MM-DD", "YYYY/MM/DD", moment.ISO_8601],
    true
  );
  if (!date.isValid()) {
    return "-";
  }
  if (timezone) {
    return moment.utc(time).clone().tz(timezone).format("MMM D, YYYY");
  }
  return moment.utc(time).format("MMM D, YYYY");
};

/* Example usage:

const isoString1 = '2024-05-15T19:25:12.095Z';
const timeZone = 'us/eastern'
console.log(formatMeasureTime(isoString1, timeZone)); // Output: "May 15, 2024, 7:25:12 PM (EDT)"

*/

// utils.ts

export const getValueByDataIndexKey = (obj: any, key: string): any => {
  if (!obj) return "-";
  const keys = key.split(".");
  let value: any = obj;
  for (const k of keys) {
    if (Array.isArray(value)) {
      const index = isNaN(parseInt(k, 10)) ? 0 : parseInt(k, 10);
      value = value[index];
    } else {
      value = value?.[k];
    }
    if (value === undefined || value === null || value === "unknown") {
      return "-";
    }
  }
  return value;
};

export const getAllTimeZones = () => {
  const timeZoneList = moment.tz.names();
  const timeZoneListWithAbbreviations = timeZoneList.map((timezone) => {
    const currentTimeInTimeZone = moment.tz(timezone);
    const abbreviation = currentTimeInTimeZone.format("z");
    return {
      timezone: timezone,
      timezoneAbb: abbreviation,
    };
  });

  return timeZoneListWithAbbreviations;
};

export const convertTimesZoneAbb = (timezone: any) => {
  const currentTimeInTimeZone = moment.tz(timezone);
  const abbreviation = currentTimeInTimeZone.format("z");
  return `${abbreviation}(${timezone})`;
};
export const generateExportTypeParams = (
  searchKey: string | null,
  searchTerm: string | null,
  dataType: string | null,
  auditsPageHeaders: any[],
  tableSearchHeaders?: any
) => {
  const exportParams: any = {};

  if (dataType) {
    if (tableSearchHeaders) {
      console.log("Headers in exportpage", tableSearchHeaders.value);
    }

    exportParams.exportType = dataType;
    exportParams.tableHeaders = JSON.stringify(auditsPageHeaders);
    console.log(
      "going inside the exportparams tableHeadera",
      exportParams.tableHeaders
    );

    if (searchKey && searchTerm) {
      const searchedKeyFor = searchKey;
      const searchHeaders = {
        [searchedKeyFor]: searchTerm,
      };
      if (tableSearchHeaders?.value?.length == 2) {
        // filter over two fields either in data or lims page.
        // console.log("Original tableSearchHeaders:", tableSearchHeaders.value);
        const modifiedHeaders = tableSearchHeaders.value.map(
          (obj: Record<string, any>) => {
            const newObj: Record<string, any> = {};

            Object.keys(obj).forEach((key: string) => {
              if (key === "searchKey") {
                newObj["Sample Status"] = obj[key];
              } else {
                newObj[key] = obj[key];
              }
            });

            return newObj;
          }
        );

        console.log("Modified tableSearchHeaders:", modifiedHeaders);
        exportParams.searchHeaders = JSON.stringify(modifiedHeaders);
      } else {
        exportParams.searchHeaders = JSON.stringify([searchHeaders]);
      }

      // console.log("going inside the exportparams", exportParams.searchHeaders);
    }
  }

  return exportParams;
};

export function processHeartbeat(incomingHeartbeat: any) {
  const processedHeartbeat = { ...incomingHeartbeat };
  // console.log("processHeartbeat", processedHeartbeat);
  // Initialize new fields
  processedHeartbeat.isSampling = false;
  processedHeartbeat.sampleType = "";
  processedHeartbeat.actionStatus = "";
  processedHeartbeat.connectionStatus = "connected";
  processedHeartbeat.taskId = null;
  processedHeartbeat.taskResultId = null;
  processedHeartbeat.jobId = null;
  processedHeartbeat.activeJobId = null;
  processedHeartbeat.isRecurringSample = false;

  //console.log("::: processedHeartbeat ::: ", processedHeartbeat);

  if (processedHeartbeat?.basic?.status.toLowerCase() === "disconnected") {
    processedHeartbeat.connectionStatus = "disconnected";
  }

  if (processedHeartbeat?.basic?.sample_type) {
    processedHeartbeat.sampleType = processedHeartbeat?.basic?.sample_type;
  }

  if (processedHeartbeat?.basic?.active_job_id) {
    processedHeartbeat.isSampling = true;
  }
  // temprory fix to keep the device in  use state untill the sample buffers are cleared
  // if (processedHeartbeat?.basic?.real_time_data?.samples_buffered > 1) {
  //   processedHeartbeat.isSampling = true;
  // }

  if (processedHeartbeat?.basic?.active_task_id) {
    processedHeartbeat.taskId = processedHeartbeat.basic.active_task_id;
  }

  if (processedHeartbeat?.basic?.last_completed_task_result_id) {
    processedHeartbeat.taskResultId =
      processedHeartbeat.basic.last_completed_task_result_id;
  }

  if (processedHeartbeat?.basic?.active_job_id) {
    processedHeartbeat.activeJobId = processedHeartbeat.basic.active_job_id;
    processedHeartbeat.jobId = processedHeartbeat.basic.active_job_id;
  }
  if (processedHeartbeat?.basic?.is_recurring_sample) {
    processedHeartbeat.isRecurringSample =
      processedHeartbeat.basic.is_recurring_sample;
  }
  if (processedHeartbeat?.basic?.action_status) {
    processedHeartbeat.actionStatus = processedHeartbeat.basic.action_status;
  }
  // setting default sample type as sample for external samples
  // if (
  //   !("progress" in processedHeartbeat) &&
  //   processedHeartbeat?.basic?.status.toLowerCase() === "running"
  // ) {
  //   processedHeartbeat.sampleType = "Sample";
  // }

  // if (processedHeartbeat?.basic?.current_job_id !== null) {
  //   processedHeartbeat.sampleType = "Sample-Interval";
  // }

  // if (
  //   processedHeartbeat.progress &&
  //   processedHeartbeat?.basic?.status.toLowerCase() !== "idle"
  // ) {
  //   const progressHeartbeat = processedHeartbeat.progress;
  //   const tasks = progressHeartbeat?.running_tasks
  //     ? Object.values(progressHeartbeat?.running_tasks)
  //     : [];

  //   // console.log("running tasks", tasks);

  //   if (tasks.length > 0) {
  //     const task: any = tasks[tasks.length - 1];
  //     if (task?.input?.task_def_id) {
  //       const {
  //         status,
  //         input: { sample_type, task_id, job_id },
  //       } = task;

  //       // console.log("utils task_id", task_id);
  //       // console.log("utils job_id", job_id);
  //       processedHeartbeat.taskId = task_id;
  //       processedHeartbeat.jobId = job_id;

  //       // console.log(
  //       //   "progressHeartbeat.running_tasks.[processedHeartbeat.taskId].cancel_operation",
  //       //   progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //       //     ?.cancel_operation
  //       // );

  //       if (
  //         ["running", "error", "canceling", "waiting"].includes(
  //           status.toLowerCase()
  //         )
  //       ) {
  //         processedHeartbeat.isSampling = true;
  //         processedHeartbeat.sampleType = sample_type;
  //       } else {
  //         processedHeartbeat.isSampling = false;
  //       }

  //       if (
  //         ["running"].includes(status.toLowerCase()) ||
  //         ["error"].includes(status.toLowerCase()) ||
  //         ["waiting"].includes(status.toLowerCase())
  //       ) {
  //         processedHeartbeat.actionStatus = "In-Progress";
  //       }

  //       if (["error"].includes(status.toLowerCase())) {
  //         // processedHeartbeat.connectionStatus = "disconnected";

  //         if (
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation &&
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation === "force-drop"
  //         ) {
  //           processedHeartbeat.actionStatus = "Force-Dropping";
  //         }
  //       }

  //       if (["canceled"].includes(status.toLowerCase())) {
  //         if (
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation &&
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation === "abort"
  //         ) {
  //           processedHeartbeat.actionStatus = "Aborted";
  //         }

  //         if (
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation &&
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation === "force-drop"
  //         ) {
  //           processedHeartbeat.actionStatus = "Force-Dropped";
  //         }
  //       }

  //       if (["canceling"].includes(status.toLowerCase())) {
  //         if (
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation &&
  //           progressHeartbeat?.running_tasks[
  //             processedHeartbeat.taskId
  //           ]?.cancel_operation.includes("abort")
  //         ) {
  //           processedHeartbeat.actionStatus = "Aborting";
  //         }

  //         if (
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation &&
  //           progressHeartbeat?.running_tasks[processedHeartbeat.taskId]
  //             ?.cancel_operation === "force-drop"
  //         ) {
  //           processedHeartbeat.actionStatus = "Force Dropping";
  //         }

  //         // console.log(
  //         //   "::progressHeartbeat after canceling check::",
  //         //   progressHeartbeat
  //         // );
  //       }
  //       // break;
  //     }
  //   }

  //   // if (
  //   //   progressHeartbeat.last_complete_task_id !== null &&
  //   //   progressHeartbeat.last_complete_task_id !== ""
  //   // ) {
  //   //   processedHeartbeat.taskId = processedHeartbeat.last_complete_task_id;
  //   // }
  // }
  return processedHeartbeat;
}

// Translate to different language based on page
export const translateLabel = (page: string, key: string) => {
  const { t, te } = useI18n();
  // Try normal key
  if (te(`${page}.${key}`)) {
    return t(`${page}.${key}`);
  }

  // Try bracket-notation (for keys with dots, spaces, symbols)
  if (te(`${page}['${key}']`)) {
    return t(`${page}['${key}']`);
  }

  // Fallback to raw key
  return key;
};

// interface AssetTime {
//   time: string; // ISO string or any valid date string format
//   offset?: number; // Offset in minutes (optional)
// }

// /**
//  * Checks if the asset time matches the current time in the site timezone and local timezone.
//  * Logs the time conversions at each step.
//  * @param assetTime - Object containing the time and optional offset.
//  * @param siteTimezone - The timezone of the site.
//  * @returns `true` if the time matches, `false` otherwise.
//  */
// export function conversionTimeMatching(
//   assetTime: AssetTime,
//   siteTimezone: string
// ): boolean {
//   const { time, offset } = assetTime;

//   // Step 1: Log the original asset time
//   console.log(`Original Asset Time: ${time}`);

//   // Step 2: If offset is provided, adjust asset time by the offset, otherwise use the raw asset time
//   let adjustedAssetTime;
//   if (offset !== undefined) {
//     adjustedAssetTime = moment(time).add(offset, "minutes");
//     console.log(
//       `Adjusted Asset Time with Offset (${offset} minutes): ${adjustedAssetTime.format()}`
//     );
//   } else {
//     // No offset, use asset_time as is
//     adjustedAssetTime = moment(time);
//     console.log(
//       `Adjusted Asset Time without Offset: ${adjustedAssetTime.format()}`
//     );
//   }

//   // Step 3: Convert the asset time to the site timezone and log it
//   const assetTimeInSiteTimezone = moment.tz(adjustedAssetTime, siteTimezone);
//   console.log(
//     `Asset Time in Site Timezone (${siteTimezone}): ${assetTimeInSiteTimezone.format()}`
//   );

//   // Step 4: Get the current time in the site timezone and log it
//   const currentSiteTime = moment.tz(siteTimezone);
//   console.log(
//     `Current Time in Site Timezone (${siteTimezone}): ${currentSiteTime.format()}`
//   );

//   // Step 5: Check if the converted asset time is the same as the current site time
//   const isSiteTimeMatching = assetTimeInSiteTimezone.isSame(
//     currentSiteTime,
//     "minute"
//   );
//   console.log(`Is Site Time Matching?: ${isSiteTimeMatching}`);

//   if (!isSiteTimeMatching) {
//     return false;
//   }

//   // Step 6: Convert the matched site time to the local timezone and log it
//   const assetTimeInLocalTimezone = assetTimeInSiteTimezone.clone().local();
//   console.log(
//     `Asset Time in Local Timezone: ${assetTimeInLocalTimezone.format()}`
//   );

//   // Step 7: Get the current local time and log it
//   const currentLocalTime = moment();
//   console.log(`Current Local Time: ${currentLocalTime.format()}`);

//   // Step 8: Check if the local time is within a 1 to 10 minute range of the current local time
//   const localTimeDifference = Math.abs(
//     assetTimeInLocalTimezone.diff(currentLocalTime, "minutes")
//   );
//   const isLocalTimeMatching = localTimeDifference <= 10;
//   console.log(
//     `Is Local Time Matching (within 1-10 minutes)?: ${isLocalTimeMatching}`
//   );

//   return isLocalTimeMatching;
// }

/**
 * Compares asset time with the current time of the site zone and checks if they differ by no more than ±10 minutes.
 * @param {Object} assetTimeObj - Object containing `asset_time`.
 * @param {String} siteZone - The current time zone of the site.
 * @returns {Boolean} - Returns true if the times are within ±10 minutes, else false.
 */
// export function compareAssetTime(
//   assetTimeObj: { time: string }, // Adjusting to the correct property
//   siteZone: string
// ): boolean {
//   // Debug: Log assetTimeObj to verify structure
//   console.log("AssetTimeObj:", assetTimeObj);

//   // Extract the correct time property from assetTimeObj
//   const asset_time = assetTimeObj?.time;

//   // Debug: Check if asset_time is correctly retrieved
//   console.log("Asset Time Retrieved:", asset_time);

//   // Ensure asset_time is available
//   if (!asset_time) {
//     console.error(
//       "Invalid asset time, 'time' property is undefined:",
//       asset_time
//     );
//     return false;
//   }

//   // Step 1: Parse asset_time as is (treat it as raw time without applying any timezone changes)
//   const assetTime = moment(asset_time, moment.ISO_8601);
//   console.log("Present Asset Time:", assetTime);

//   // Check if the asset time is valid
//   if (!assetTime.isValid()) {
//     console.error("Invalid asset time:", asset_time);
//     return false;
//   }

//   // Step 2: Get the current time in the site timezone
//   const currentSiteTime = moment().tz(siteZone);

//   // Step 3: Calculate the time difference in minutes between current site time and asset time
//   const timeDifference = Math.abs(currentSiteTime.diff(assetTime, "minutes"));

//   // Debugging logs to track comparison details
//   console.log(
//     "Comparison: Asset Time:",
//     assetTime.format(),
//     "Current Site Time:",
//     currentSiteTime.format(),
//     "Time Difference (minutes):",
//     timeDifference
//   );

//   // Step 4: Return true if the difference is within ±10 minutes, otherwise return false
//   return timeDifference <= 691;
// }

interface AssetTimeObj {
  time: string;
  offset?: string;
  timeZone?: string;
}

/**
 * Compares asset time with current time in siteZone, returning true if difference is within threshold.
 * @param assetTimeObj - Object containing time, optional offset, and optional timeZone.
 * @param siteZone - The target timezone (e.g., 'America/Denver').
 * @returns boolean - True if time difference is within threshold, false otherwise.
 */
export function compareAssetTime(
  assetTimeObj: AssetTimeObj,
  siteZone: string
): boolean {
  // Validate inputs
  if (!siteZone || !assetTimeObj?.time) {
    // console.log("compareAssetTime - Invalid inputs:", {
    //   siteZone,
    //   assetTime: assetTimeObj?.time,
    // });
    return false;
  }

  const assetTime = assetTimeObj.time;
  const assetTimeZone = assetTimeObj.timeZone;

  // Get current time in siteZone
  const currentTimeSiteZone = moment.tz(siteZone);

  // console.log(
  //   "compareAssetTime - Asset time:",
  //   assetTime,
  //   "Asset timezone:",
  //   assetTimeZone,
  //   "Site timezone:",
  //   siteZone,
  //   "Current time in site zone:",
  //   currentTimeSiteZone.format()
  // );

  // Check timezone match if assetTimeZone is provided
  if (assetTimeZone && assetTimeZone !== siteZone) {
    // console.log(
    //   "compareAssetTime - Timezone mismatch:",
    //   assetTimeZone,
    //   "!==",
    //   siteZone
    // );
    return false;
  }

  // Parse asset time using siteZone (backend assumes assetTime is in siteZone if no timeZone provided)
  const assetMoment = moment.tz(assetTime, siteZone);

  // Validate assetMoment
  if (!assetMoment.isValid()) {
    // console.log("compareAssetTime - Invalid asset time:", assetTime);
    return false;
  }

  // Calculate time difference in minutes
  const diffInMinutes = Math.abs(
    currentTimeSiteZone.diff(assetMoment, "minutes")
  );

  // Parse threshold from config, default to 60 if undefined or invalid
  const thresholdMinutes =
    parseInt(process.env.VUE_APP_TIME_CONFIGURABLE || "30", 10) || 30;

  // console.log(
  //   "compareAssetTime - Time difference in minutes:",
  //   diffInMinutes,
  //   "Threshold:",
  //   thresholdMinutes
  // );

  // Return true if difference is within threshold
  return diffInMinutes <= thresholdMinutes;
}
export const convertAndFormatTimeUtc = (
  timeString: string,
  targetTimeZone: string
) => {
  // console.log("timeString", timeString);
  // Ensure the timeString is a valid string and in UTC ISO 8601 format
  if (
    !timeString ||
    typeof timeString !== "string" ||
    !timeString.endsWith("Z")
  ) {
    return ""; // Return an empty string if timeString is not valid or doesn't end with "Z"
  }

  const isValidTime = moment.utc(timeString, moment.ISO_8601, true).isValid();
  if (!isValidTime) {
    return ""; // Return an empty string if the time is not a valid ISO 8601 format
  }

  // Validate the targetTimeZone
  if (typeof targetTimeZone !== "string" || !moment.tz.zone(targetTimeZone)) {
    return ""; // Return an empty string if targetTimeZone is invalid
  }

  // If the target time zone is UTC, format and return the time directly
  const time =
    targetTimeZone === "UTC"
      ? moment(timeString)
      : moment(timeString).tz(targetTimeZone); // Convert to target time zone

  // console.log("converted time ", time.format("MMM DD, YYYY, hh:mm:ss A (z)"));
  // Format the time as "Oct 04, 2024, 02:17:15 PM (Asia/Kolkata)"
  return time.format("MMM DD, YYYY, hh:mm:ss A (z)");
};
export const formatTimeToSeconds = (timeString: any): string => {
  if (
    !timeString ||
    typeof timeString !== "string" ||
    !/^\d{2}:\d{2}:\d{2}$/.test(timeString)
  ) {
    return "-"; // Return "0 secs" for invalid or missing time strings
  }

  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return `${totalSeconds} secs`; // Convert total seconds to string with "secs"
};
