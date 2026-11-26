import { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Define interfaces matching the data structure
interface Village {
  [key: string]: any;
}

interface SubDistrict {
  villages?: Village[];
  [key: string]: any;
}

interface District {
  district: string;
  subDistricts: SubDistrict[];
}

interface StateData {
  state: string;
  districts: District[];
}

// Define request param interfaces for type safety
interface StateParams {
  state: string;
}

interface DistrictParams extends StateParams {
  district: string;
}

interface SubDistrictParams extends DistrictParams {
  subDistrictIndex: string;
}

export class LocationController {
  // Static variable to hold loaded location data
  private static locationData: StateData[] = [];

  /**
   * Initialize location data - call this during app startup
   */
  static initializeLocationData(): void {
    try {
      // Try multiple possible paths to find the data file
      const possiblePaths = [
        path.resolve(process.cwd(), "src/routes/data/location.json"),
        path.resolve(process.cwd(), "./src/routes/data/location.json"),
        path.resolve(__dirname, "../routes/data/location.json"),
        path.resolve(__dirname, "../../routes/data/location.json"),
        path.resolve(__dirname, "../data/location.json"),
      ];

      let loadedData = null;
      let loadedPath = null;

      // Try each path until we find one that works
      for (const dataPath of possiblePaths) {
        try {
          if (fs.existsSync(dataPath)) {
            console.log(`Found location data at: ${dataPath}`);
            const rawData = fs.readFileSync(dataPath, "utf8");
            loadedData = JSON.parse(rawData);
            loadedPath = dataPath;
            break;
          }
        } catch (err) {
          console.log(`Could not load from ${dataPath}`);
        }
      }

      if (loadedData) {
        LocationController.locationData = loadedData;
        console.log(
          `Location data loaded with ${LocationController.locationData.length} states from ${loadedPath}`
        );
      } else {
        console.error(
          "Could not find location data file in any expected location"
        );
        // Initialize with empty array to avoid null checks
        LocationController.locationData = [];
      }
    } catch (error) {
      console.error("Error loading location data:", error);
      LocationController.locationData = [];
    }
  }

  /**
   * Get all Indian states
   */
  static async getStates(req: Request, res: Response): Promise<void> {
    try {
      // Check if data is loaded, if not try to load it
      if (
        !LocationController.locationData ||
        LocationController.locationData.length === 0
      ) {
        LocationController.initializeLocationData();
      }

      // If still no data, return a better error
      if (LocationController.locationData.length === 0) {
        res.status(500).json({
          success: false,
          message:
            "Location data could not be loaded. Please check server configuration.",
        });
        return;
      }

      const states = LocationController.locationData.map(
        (stateData) => stateData.state
      );

      res.status(200).json({
        success: true,
        count: states.length,
        data: states,
      });
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching states",
      });
    }
  }

  /**
   * Get districts for a specific state
   */
  static async getDistricts(
    req: Request<StateParams>,
    res: Response
  ): Promise<void> {
    try {
      const state = req.params.state;

      // Check if data is loaded
      if (
        !LocationController.locationData ||
        LocationController.locationData.length === 0
      ) {
        LocationController.initializeLocationData();
      }

      const stateData = LocationController.locationData.find(
        (data) => data.state === state
      );

      if (!stateData) {
        res.status(404).json({
          success: false,
          message: `No districts found for state: ${state}`,
        });
        return;
      }

      const districts = stateData.districts.map(
        (district) => district.district
      );

      res.status(200).json({
        success: true,
        state: state,
        count: districts.length,
        data: districts,
      });
    } catch (error) {
      console.error(
        `Error fetching districts for state: ${req.params.state}`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Server error while fetching districts",
      });
    }
  }

  /**
   * Get sub-districts for a specific district in a state
   */
  static async getSubDistricts(
    req: Request<DistrictParams>,
    res: Response
  ): Promise<void> {
    try {
      const { state, district } = req.params;

      // Check if data is loaded
      if (
        !LocationController.locationData ||
        LocationController.locationData.length === 0
      ) {
        LocationController.initializeLocationData();
      }

      const stateData = LocationController.locationData.find(
        (data) => data.state === state
      );

      if (!stateData) {
        res.status(404).json({
          success: false,
          message: `State not found: ${state}`,
        });
        return;
      }

      const districtData = stateData.districts.find(
        (d) => d.district === district
      );

      if (!districtData) {
        res.status(404).json({
          success: false,
          message: `District not found: ${district} in state ${state}`,
        });
        return;
      }

      const subDistricts = districtData.subDistricts;

      res.status(200).json({
        success: true,
        state: state,
        district: district,
        count: subDistricts.length,
        data: subDistricts,
      });
    } catch (error) {
      console.error(
        `Error fetching sub-districts for district: ${req.params.district} in state: ${req.params.state}`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Server error while fetching sub-districts",
      });
    }
  }

  /**
   * Get villages for a specific sub-district in a district and state
   */
  static async getVillages(
    req: Request<SubDistrictParams>,
    res: Response
  ): Promise<void> {
    try {
      const { state, district, subDistrictIndex } = req.params;
      const index = parseInt(subDistrictIndex);

      // Check if data is loaded
      if (
        !LocationController.locationData ||
        LocationController.locationData.length === 0
      ) {
        LocationController.initializeLocationData();
      }

      if (isNaN(index)) {
        res.status(400).json({
          success: false,
          message: "Sub-district index must be a number",
        });
        return;
      }

      const stateData = LocationController.locationData.find(
        (data) => data.state === state
      );

      if (!stateData) {
        res.status(404).json({
          success: false,
          message: `State not found: ${state}`,
        });
        return;
      }

      const districtData = stateData.districts.find(
        (d) => d.district === district
      );

      if (!districtData) {
        res.status(404).json({
          success: false,
          message: `District not found: ${district} in state ${state}`,
        });
        return;
      }

      if (index < 0 || index >= districtData.subDistricts.length) {
        res.status(404).json({
          success: false,
          message: `Sub-district index out of range: ${index}`,
        });
        return;
      }

      const subDistrict = districtData.subDistricts[index];
      const villages = subDistrict.villages || [];

      res.status(200).json({
        success: true,
        state: state,
        district: district,
        subDistrictIndex: index,
        count: villages.length,
        data: villages,
      });
    } catch (error) {
      console.error(
        `Error fetching villages for sub-district index ${req.params.subDistrictIndex} in district: ${req.params.district}, state: ${req.params.state}`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Server error while fetching villages",
      });
    }
  }
}

// Initialize location data when the module is imported
LocationController.initializeLocationData();
