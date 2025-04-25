# FEATURES_LIST: Bedrock Pricing Calculator (Revised Order)

This document outlines the high-level features required for the Bedrock Pricing Calculator, ordered for incremental development and testing. Each feature should be verifiable upon completion.

---

## Phase 1: Local Development & Core Logic

### Feature 1: Project Setup & Basic UI Shell
*   **Description:** Initialize the React/TypeScript frontend project (e.g., using Vite). Integrate the chosen UI library (Mantine UI - ADR-014) and set up basic project structure (components, layout). Implement the main calculator page shell/layout without dynamic data. Set up the testing framework (e.g., Vitest).
*   **Value:** Establishes the frontend codebase, development environment, and basic visual structure.
*   **Verification:**
    *   Project runs locally (`npm run dev` or similar).
    *   Basic calculator page shell renders correctly in the browser.
    *   Initial unit tests for basic components pass.

### Feature 2: Local Pricing Data Parsing & Structuring
*   **Description:** Develop the core logic to parse pricing information from a sample (or locally saved) HTML file of the AWS Bedrock pricing page. Define TypeScript interfaces/types for the structured pricing data (models, regions, modes, units, prices) according to ADR-011 Option 2. Ensure the parser correctly handles different pricing tables (On-Demand, Batch, Provisioned, Image, etc.).
*   **Value:** Creates the reusable logic for extracting pricing data, independent of live scraping or databases.
*   **Verification:**
    *   Unit tests prove the parser correctly extracts and structures data from various sections of the sample HTML into the defined TypeScript types.

### Feature 3: Local Calculation Engine & State Management
*   **Description:** Implement the core cost calculation functions (as pure functions where possible) for different pricing models (On-Demand, Batch, Provisioned, Image, Customization) using the structured pricing data types from Feature 2. Set up the chosen state management solution (Zustand - ADR-013) for the frontend.
*   **Value:** Core business logic for calculating costs and frontend state structure.
*   **Verification:**
    *   Unit tests verify calculation functions produce correct results for various inputs and pricing data scenarios.
    *   Basic Zustand store is set up and testable.

### Feature 4: Basic UI Interaction (On-Demand - Local Data)
*   **Description:** Connect the UI shell (Feature 1) to the local calculation engine (Feature 3) and state management. Populate UI elements (dropdowns for provider/model/region) using *mock* structured pricing data (derived from Feature 2). Implement input fields for On-Demand tokens. Trigger calculations on input change and display the results using the state management store.
*   **Value:** First interactive version of the calculator, demonstrating the core On-Demand calculation flow using local data.
*   **Verification:**
    *   UI dropdowns show mock models/regions.
    *   Entering token counts updates the relevant state in the Zustand store.
    *   The calculated cost is displayed accurately in the UI based on mock data and local calculations.

---

## Phase 2: Cloud Backend & Data Integration

### Feature 5: Terraform - Core Backend Infrastructure (DynamoDB `BedrockPricingData`, Lambda Role)
*   **Description:** Create initial Terraform configurations (`.tf` files) to define and provision the `BedrockPricingData` DynamoDB table (as per ADR-011 Option 2) and a basic IAM execution role for the scraper Lambda function.
*   **Value:** Provisions the persistent cloud storage for pricing data and the necessary permissions for the data collection function. Enables testing against real AWS resources.
*   **Verification:**
    *   `terraform plan` shows the correct resources (DynamoDB table, IAM role).
    *   `terraform apply` successfully provisions these resources in AWS.
    *   The table and role are visible and correctly configured in the AWS console.

### Feature 6: Scraper Lambda Function & Deployment
*   **Description:** Create an AWS Lambda function (e.g., in Node.js or Python) that incorporates the parsing logic (Feature 2), fetches the live pricing page URL, and writes the structured data to the `BedrockPricingData` DynamoDB table (created in Feature 5). Add Lambda deployment configuration to Terraform. Include necessary dependencies (e.g., AWS SDK, HTML parser like Cheerio/BeautifulSoup).
*   **Value:** An automated function capable of fetching, parsing, and storing live pricing data in the cloud.
*   **Verification:**
    *   Terraform successfully deploys the Lambda function.
    *   Manually invoking the Lambda function in the AWS console successfully populates/updates the `BedrockPricingData` table with data scraped from the live AWS page. Check logs for errors.

### Feature 7: Terraform - Pricing Data API (API Gateway & Lambda)
*   **Description:** Create a Lambda function to read pricing data from the `BedrockPricingData` table. Define an API Gateway REST API resource and method (e.g., `GET /pricing`) in Terraform, configured to trigger this Lambda. Grant the Lambda necessary IAM permissions to read from DynamoDB.
*   **Value:** Provides a secure HTTP endpoint for the frontend to fetch live pricing data.
*   **Verification:**
    *   Terraform successfully deploys the API Gateway endpoint and the read Lambda.
    *   Calling the API Gateway endpoint URL returns a successful response (200 OK) with pricing data queried from the DynamoDB table.

### Feature 8: Frontend Integration with Live Pricing API
*   **Description:** Modify the frontend application (from Feature 4) to fetch pricing data from the deployed API endpoint (Feature 7) on load, instead of using mock data. Update the Zustand store with the fetched live data. Handle loading states and potential API errors gracefully in the UI.
*   **Value:** Connects the frontend to the live, dynamically updated pricing data, making the calculator reflect real-world costs.
*   **Verification:**
    *   Frontend successfully calls the API on load.
    *   UI dropdowns (models, regions) are populated with data fetched from the live API.
    *   Loading indicators/error messages are displayed appropriately.
    *   Calculations now use live pricing data.

### Feature 9: Scheduled Scraper Trigger & Monitoring
*   **Description:** Add Terraform configuration for an Amazon EventBridge Scheduler rule to automatically trigger the scraper Lambda function (Feature 6) on a regular schedule (e.g., daily). Implement basic CloudWatch Alarms in Terraform to monitor the scraper Lambda for errors.
*   **Value:** Ensures pricing data is kept up-to-date automatically and provides basic alerting for failures.
*   **Verification:**
    *   Terraform successfully creates the EventBridge rule and CloudWatch alarms.
    *   Monitor CloudWatch Logs/Metrics to confirm the scraper runs on schedule.
    *   Test error conditions (e.g., temporarily break the parser) to verify alarms trigger.

---

## Phase 3: Expanding Calculator Features

### Feature 10: Add Batch Inference Calculation
*   **Description:** Update the scraper (Feature 6) to parse Batch inference pricing. Update the Pricing API (Feature 7) if needed. Update the frontend (Feature 8) calculation logic and UI components to allow selecting Batch mode (where applicable) and calculating/displaying Batch costs.
*   **Value:** Adds support for Batch inference pricing mode.
*   **Verification:**
    *   Scraper correctly stores Batch pricing. API returns it.
    *   UI allows selecting Batch mode for relevant models.
    *   Batch costs are calculated and displayed correctly based on user inputs.

### Feature 11: Add Provisioned Throughput Calculation
*   **Description:** Update scraper, API, calculation logic, and UI to support Provisioned Throughput mode, including selecting commitment terms (1/6 month) and model units.
*   **Value:** Adds support for Provisioned Throughput pricing mode.
*   **Verification:**
    *   Scraper correctly stores PT pricing. API returns it.
    *   UI allows selecting PT mode, terms, units for relevant models.
    *   PT costs are calculated and displayed correctly.

### Feature 12: Add Image Model Calculation
*   **Description:** Update scraper, API, calculation logic, and UI to support image generation models, including relevant parameters (e.g., quality, size if price-affecting) and number of images.
*   **Value:** Adds support for image generation pricing.
*   **Verification:**
    *   Scraper correctly stores image pricing. API returns it.
    *   UI allows selecting image models and parameters.
    *   Image generation costs are calculated and displayed correctly.

### Feature 13: Add Model Customization Cost Calculation
*   **Description:** Update scraper, API, calculation logic, and UI to support model customization costs (fine-tuning training, continued pre-training, monthly storage). Include inputs for tokens, epochs, storage duration. Account for the associated inference cost (requires Provisioned Throughput).
*   **Value:** Adds support for estimating model customization costs.
*   **Verification:**
    *   Scraper correctly stores customization pricing. API returns it.
    *   UI allows inputting customization parameters.
    *   Training, storage, and associated inference costs are calculated and displayed correctly.

---

## Phase 4: Estimation Persistence & Sharing

### Feature 14: Terraform - Estimation Storage Infrastructure (`BedrockEstimations` Table)
*   **Description:** Add Terraform configuration for the `BedrockEstimations` DynamoDB table, including the primary key (`estimationId`) and required GSIs (`EditorIdIndex`, `ViewerIdIndex`) as defined in ADR-012.
*   **Value:** Provisions the cloud infrastructure needed to store user estimations.
*   **Verification:**
    *   `terraform apply` successfully creates the `BedrockEstimations` table with specified keys and indexes.

### Feature 15: Save Estimation API & Integration
*   **Description:** Create a new Lambda function and API Gateway endpoint (`POST /estimations`) to handle saving calculator state. The Lambda should generate unique `estimationId`, `viewerId`, `editorId`, and save the estimation data to the `BedrockEstimations` table. Grant necessary IAM permissions. Integrate a "Save" button in the frontend UI to call this API and display the returned viewer/editor links/IDs.
*   **Value:** Allows users to persist their calculations.
*   **Verification:**
    *   Terraform deploys the save Lambda and API endpoint.
    *   Clicking "Save" in the UI successfully calls the API.
    *   A new item appears in the `BedrockEstimations` table with correct data and IDs.
    *   UI displays the returned sharing links/IDs.

### Feature 16: Retrieve Estimation API & Basic Routing
*   **Description:** Create a Lambda function and API Gateway endpoints (e.g., `GET /estimations/view/{viewerId}`, `GET /estimations/edit/{editorId}`) to retrieve estimation data using the `viewerId` or `editorId` (via GSIs). Grant necessary IAM permissions. Implement basic frontend routing (e.g., using `react-router-dom`) to handle these path structures.
*   **Value:** Backend capability to fetch saved data and frontend structure to handle shared links.
*   **Verification:**
    *   Terraform deploys the retrieve Lambda and API endpoints.
    *   Calling the API endpoints with valid IDs returns the correct estimation data. Returns 404 for invalid IDs.
    *   Frontend routes `/view/...` and `/edit/...` are registered.

### Feature 17: View Saved Estimation (Read-Only UI)
*   **Description:** Enhance the frontend component for the `/view/:viewerId` route. Fetch the estimation data using the retrieve API (Feature 16), populate the calculator UI state, and ensure all input elements are disabled (read-only). Hide the "Save" button.
*   **Value:** Enables viewing shared estimations in a non-editable format.
*   **Verification:**
    *   Navigating to a valid `/view/{viewerId}` URL displays the correct saved estimation data.
    *   All calculator inputs (dropdowns, number inputs) are disabled.
    *   The Save button is not visible/active.

### Feature 18: Update Estimation API & Edit UI
*   **Description:** Create a Lambda function and API Gateway endpoint (e.g., `PUT /estimations/edit/{editorId}`) to update an existing estimation, validating that the update is requested via the `editorId`. Grant necessary IAM permissions. Enhance the frontend component for the `/edit/:editorId` route to fetch data, populate the UI (keeping inputs enabled), and change the "Save" button's behavior to call this update API endpoint.
*   **Value:** Enables users with the editor link to modify and save changes to estimations.
*   **Verification:**
    *   Terraform deploys the update Lambda and API endpoint.
    *   Navigating to `/edit/{editorId}` displays the data in an editable form.
    *   Making changes and clicking "Save" calls the update API endpoint.
    *   The corresponding item in the `BedrockEstimations` table is updated.
    *   Attempting to update via the viewer ID fails.

---

## Phase 5: Production Deployment

### Feature 19: Terraform - Frontend Hosting Infrastructure (S3, CloudFront)
*   **Description:** Add Terraform configuration for an S3 bucket configured for static website hosting and a CloudFront distribution pointing to the S3 bucket. Configure CloudFront behaviors to serve static assets and route API requests (e.g., `/api/*`) to the API Gateway stage URL. Ensure HTTPS is enforced.
*   **Value:** Provisions the scalable, secure, and performant infrastructure for hosting the frontend application globally.
*   **Verification:**
    *   `terraform apply` successfully creates and configures the S3 bucket and CloudFront distribution.
    *   CloudFront distribution URL is accessible over HTTPS.

### Feature 20: Frontend Build & Deployment Pipeline
*   **Description:** Implement a robust build process for the React application (e.g., `npm run build`). Create a script or CI/CD pipeline (e.g., GitHub Actions, AWS CodePipeline) that automates: building the frontend, syncing the static assets to the S3 bucket (Feature 19), and creating a CloudFront cache invalidation.
*   **Value:** Enables automated, repeatable deployments of the frontend application.
*   **Verification:**
    *   Build process runs without errors.
    *   Running the deployment script/pipeline successfully updates the files in the S3 bucket.
    *   Changes are reflected on the CloudFront distribution URL after a short delay (cache invalidation). 