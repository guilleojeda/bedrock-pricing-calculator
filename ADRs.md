# Architecture Decision Records (ADRs) for Bedrock Pricing Calculator

---

### ADR-001: Backend Compute Choice

*   **Status:** Accepted
*   **Context:** We need a backend to handle API requests for saving/loading estimations and potentially serving pre-processed pricing data. The user base is expected to be small initially, and operational cost efficiency is desired. We need a solution that integrates well with other AWS services and can scale if needed, without managing servers.
*   **Decision:** We will use AWS Lambda functions for the backend logic. Each core piece of functionality (e.g., saving estimation, retrieving estimation, getting latest pricing) will be implemented as a separate Lambda function.
*   **Consequences:**
    *   **Pros:** Pay-per-use pricing model is cost-effective for low traffic. Automatic scaling handles variable loads. No server management overhead. Integrates seamlessly with other AWS services like API Gateway and DynamoDB.
    *   **Cons:** Cold starts can introduce latency for infrequent requests. Execution time limits might affect very long-running tasks (unlikely for this use case). Local development and debugging can be more complex than traditional servers. Potential for vendor lock-in with AWS.

---

### ADR-002: Frontend Framework Choice

*   **Status:** Accepted
*   **Context:** We need to build a dynamic, interactive web application for the calculator. The user experience is a priority. Maintainability and type safety are important for long-term development.
*   **Decision:** We will use React with TypeScript for the frontend application.
*   **Consequences:**
    *   **Pros:** React provides a robust component-based architecture, facilitating UI development and reuse. A large ecosystem and community support are available. TypeScript adds static typing, improving code quality, catching errors early, and enhancing developer experience, especially in larger projects. Great for building interactive UIs.
    *   **Cons:** Can have a steeper learning curve compared to simpler frameworks. Requires careful state management decisions (addressed in ADR-013). SEO can require extra effort (though less critical for a calculator tool).

---

### ADR-003: API Layer

*   **Status:** Accepted
*   **Context:** The React frontend needs a way to communicate with the AWS Lambda backend functions securely and efficiently over HTTP. We need a standard way to define, deploy, and manage these APIs.
*   **Decision:** We will use Amazon API Gateway (REST API) to expose the Lambda functions as HTTP endpoints. Each backend operation (save, load, get pricing) will correspond to a specific API Gateway route triggering the appropriate Lambda function.
*   **Consequences:**
    *   **Pros:** Fully managed service, handles scaling, authorization, throttling, caching, and monitoring. Integrates directly with Lambda. Provides a standard interface (REST) for the frontend. Supports features like request/response transformation and custom domains.
    *   **Cons:** Adds another layer of potential latency (usually minimal). Configuration can become complex for many endpoints. Costs associated with requests and data transfer (though usually aligns well with Lambda's pay-per-use model).

---

### ADR-004: Infrastructure as Code Tool

*   **Status:** Accepted
*   **Context:** All AWS infrastructure (Lambda, API Gateway, DynamoDB, S3, CloudFront, IAM roles/policies, etc.) needs to be provisioned, managed, and version-controlled reliably and repeatably. Manual configuration is error-prone and difficult to track.
*   **Decision:** We will use Terraform to define and manage all cloud infrastructure resources.
*   **Consequences:**
    *   **Pros:** Declarative syntax makes infrastructure definition readable. Supports managing resources across multiple cloud providers (though we're focusing on AWS here). State management helps track infrastructure changes. Enables repeatable deployments across different environments (dev, prod). Large community and extensive documentation.
    *   **Cons:** Requires learning HCL (HashiCorp Configuration Language). State file management needs care (using Terraform Cloud or S3 backend is recommended). Can be slower than provider-specific tools (like AWS SAM or CDK) for purely AWS-focused, serverless-heavy applications, but offers broader consistency.

---

### ADR-005: Pricing Data Storage

*   **Status:** Accepted
*   **Context:** The scraper needs to store the extracted Bedrock pricing information (models, features, prices, regions, etc.) in a structured, queryable, and scalable way. This data will be read frequently by the calculator backend/frontend. The data structure can be complex and may evolve as AWS updates its pricing page.
*   **Decision:** We will use Amazon DynamoDB to store the scraped pricing data. A single table with a flexible schema seems appropriate, potentially using composite keys or specific item types to represent models, regions, and pricing dimensions.
*   **Consequences:**
    *   **Pros:** Fully managed NoSQL database, scales seamlessly. Pay-per-use pricing for storage and read/write capacity. Low latency access. Flexible schema accommodates evolving pricing structures. Integrates well with Lambda.
    *   **Cons:** Requires careful data modeling and access pattern design to be efficient and cost-effective. Query capabilities are different from SQL databases. Can be more expensive than relational databases for complex queries or very high throughput if not designed correctly. Backup and restore strategies need consideration.

---

### ADR-006: Estimation Data Storage

*   **Status:** Accepted
*   **Context:** Users need to save their pricing estimations. Saved estimations must be retrievable later and shareable via unique links (read-only viewer and editor). The storage solution needs to handle potentially many small estimation documents and provide fast access based on unique IDs.
*   **Decision:** We will use Amazon DynamoDB to store user estimations. Each estimation will be a document/item in a dedicated table, keyed by a unique, randomly generated ID. Separate IDs can be generated for viewer and editor access, potentially stored within the same item or managed via API logic.
*   **Consequences:**
    *   **Pros:** Same benefits as for pricing data (managed, scalable, low latency, flexible schema, integrates with Lambda). Well-suited for key-value lookups based on unique estimation IDs. Cost-effective for storing potentially many small documents.
    *   **Cons:** Access patterns beyond direct ID lookup (e.g., searching estimations by user - if user accounts were added later) would require careful design (e.g., secondary indexes). Transactional guarantees differ from SQL.

---

### ADR-007: Pricing Data Update Mechanism

*   **Status:** Accepted
*   **Context:** Bedrock pricing information changes over time. We need an automated process to periodically fetch the latest pricing from the official AWS Bedrock pricing page, parse it, and update the data stored in DynamoDB (ADR-005).
*   **Decision:** We will create an AWS Lambda function responsible for scraping the AWS Bedrock pricing webpage (`https://aws.amazon.com/bedrock/pricing/`). This function will use a suitable HTML parsing library (e.g., Cheerio for Node.js, Beautiful Soup for Python). The function will be triggered on a schedule (e.g., daily) using Amazon EventBridge Scheduler. The Lambda will parse the relevant pricing tables and update/overwrite the corresponding items in the DynamoDB pricing table.
*   **Consequences:**
    *   **Pros:** Automated updates ensure data freshness. Serverless approach is cost-effective (pays only for execution time). EventBridge provides reliable scheduling. Relatively simple to implement and deploy.
    *   **Cons:** Scraping is brittle; changes to the AWS pricing page structure will break the scraper and require manual updates. AWS might discourage or block scraping (though unlikely for public pricing pages if done respectfully). Error handling and monitoring are crucial to detect scraping failures. Parsing complex, potentially changing HTML can be challenging.

---

### ADR-008: Estimation Sharing Mechanism

*   **Status:** Accepted
*   **Context:** Saved estimations need to be shareable using unique links: one for viewing (read-only) and one for editing (read/write). We need a simple, secure-enough mechanism for a low-stakes application without requiring user authentication initially.
*   **Decision:** When an estimation is saved, we will generate two distinct, cryptographically strong, random unique IDs (e.g., UUIDs or Nano IDs): one `viewerId` and one `editorId`. These IDs will be stored as attributes within the estimation item in the DynamoDB table (ADR-006). The application URLs will be structured like `/view/{viewerId}` and `/edit/{editorId}`. The backend API endpoints for retrieving and updating estimations will require the corresponding ID and enforce read-only access for `viewerId` and read/write access for `editorId`.
*   **Consequences:**
    *   **Pros:** Simple to implement. Doesn't require user accounts or complex authentication/authorization logic. Stateless from the user's perspective. IDs are hard to guess if generated properly.
    *   **Cons:** Security through obscurity; anyone with the link can access the estimation. No way to revoke access other than deleting the estimation. `editorId` grants full control, including deletion, to anyone who has it. Not suitable for sensitive data.

---

### ADR-009: Frontend Deployment

*   **Status:** Accepted
*   **Context:** The compiled React/TypeScript frontend (static assets: HTML, CSS, JavaScript) needs to be hosted and delivered efficiently and globally to users.
*   **Decision:** We will deploy the static frontend assets to an Amazon S3 bucket configured for static website hosting. We will use Amazon CloudFront as a Content Delivery Network (CDN) in front of the S3 bucket. CloudFront will handle HTTPS termination, caching, and global distribution.
*   **Consequences:**
    *   **Pros:** Highly scalable, durable, and cost-effective hosting for static assets. CloudFront provides low latency access globally through edge locations and caching. Simple integration with S3. Supports custom domains and HTTPS.
    *   **Cons:** Requires configuration for cache invalidation when new versions are deployed. Setting up CloudFront distribution and permissions needs care. Costs associated with S3 storage and CloudFront data transfer/requests.

---

### ADR-010: Backend Deployment

*   **Status:** Accepted
*   **Context:** The AWS Lambda functions, API Gateway configuration, DynamoDB tables, IAM roles/policies, and EventBridge schedules defined via Terraform (ADR-004) need to be deployed to AWS.
*   **Decision:** We will use Terraform's standard workflow (`terraform plan`, `terraform apply`) to deploy and manage all backend resources. The Lambda function code itself will be packaged (e.g., zipped) and referenced by Terraform for deployment. A CI/CD pipeline (e.g., using GitHub Actions, AWS CodePipeline) should eventually be set up to automate this process on code changes.
*   **Consequences:**
    *   **Pros:** Infrastructure and application code deployment are managed consistently through IaC. Rollbacks can be managed via version control and Terraform state. Environment parity is easier to achieve.
    *   **Cons:** Initial setup of the Terraform configuration and CI/CD pipeline requires effort. Deployment times might be longer than manual updates for small changes. Requires understanding Terraform's deployment lifecycle.

---

### ADR-011: Pricing Data Model (Initial Proposal)

*   **Status:** Proposed
*   **Context:** We need a structure for storing the scraped pricing data in DynamoDB (ADR-005) that allows efficient retrieval for the calculator. Data includes models, providers, pricing modes (On-Demand, Batch, Provisioned), regions, units (tokens, images, time), and prices.
*   **Decision:** Use a single DynamoDB table, `BedrockPricingData`. Employ a composite key strategy or specific `ItemType` attributes.
    *   **Option 1 (Composite Key):**
        *   `PK` (Partition Key): `PROVIDER#MODEL_ID` (e.g., `ANTHROPIC#claude-3-sonnet-20240229-v1:0`)
        *   `SK` (Sort Key): `REGION#PRICING_MODE#UNIT` (e.g., `us-east-1#ON_DEMAND#INPUT_TOKEN`, `us-east-1#PROVISIONED#MONTHLY_COMMITMENT_1_MONTH`)
        *   Attributes: `pricePerUnit`, `currency`, `lastUpdated`, `modelFamily`, `providerName`, etc.
    *   **Option 2 (ItemType Attribute):**
        *   `PK`: `MODEL_ID` (e.g., `claude-3-sonnet-20240229-v1:0`)
        *   `SK`: `REGION#PRICING_TYPE` (e.g., `us-east-1#ON_DEMAND_INPUT`)
        *   Attributes: `ItemType` (e.g., 'MODEL_PRICING'), `provider`, `mode`, `unit`, `price`, `currency`, `lastUpdated`.
        *   Separate items for general model info (`ItemType`: 'MODEL_INFO', `PK`: `MODEL_ID`, `SK`: `INFO`).
    *   **Decision:** Start with **Option 2** as it might offer more flexibility in querying different aspects separately (e.g., list all models regardless of pricing). We will need specific items/attributes for different pricing dimensions (On-Demand tokens, Provisioned Throughput model units, Fine-tuning costs, Image generation costs).
*   **Consequences:**
    *   **Pros:** Option 2 allows flexible querying using `PK` and `begins_with(SK)` or filters on `ItemType`. Fits DynamoDB's item-based model well. Can evolve schema by adding new `ItemType`s or attributes.
    *   **Cons:** Requires careful planning of PK/SK and attributes to cover all pricing variations. Querying across different regions or modes might require multiple queries or careful use of indexes if performance becomes an issue.

---

### ADR-012: Estimation Data Model

*   **Status:** Accepted
*   **Context:** We need to structure the estimation data stored in DynamoDB (ADR-006) to capture user inputs, calculated results, and sharing IDs.
*   **Decision:** Use a single DynamoDB table, `BedrockEstimations`.
    *   `PK` (Partition Key): `estimationId` (A unique, randomly generated ID, e.g., UUID).
    *   Attributes:
        *   `editorId`: (Unique ID for editing, indexed via GSI for lookup).
        *   `viewerId`: (Unique ID for viewing, indexed via GSI for lookup).
        *   `estimationName`: (Optional, user-provided name).
        *   `createdAt`: ISO 8601 timestamp.
        *   `updatedAt`: ISO 8601 timestamp.
        *   `estimationData`: A JSON string or DynamoDB Map containing the actual calculator inputs and results (e.g., selected models, regions, input tokens, output tokens, calculated costs per model/feature, total cost). Using a Map is generally preferred over JSON string.
        *   `schemaVersion`: Number, to handle future data structure changes.
    *   Global Secondary Indexes (GSIs):
        *   `EditorIdIndex`: `PK=editorId`
        *   `ViewerIdIndex`: `PK=viewerId`
*   **Consequences:**
    *   **Pros:** Simple key structure for direct lookup. GSIs allow efficient retrieval using sharing IDs. Flexible `estimationData` attribute accommodates complex calculation details. Schema versioning helps manage evolution.
    *   **Cons:** The `estimationData` blob might become large; requires application-level logic to parse and validate. Querying based on fields *inside* `estimationData` is not possible directly with DynamoDB (requires retrieving and filtering in the application). GSI costs add up based on storage and writes.

---

### ADR-013: Frontend State Management

*   **Status:** Proposed
*   **Context:** The React application will have complex state, including fetched pricing data, user inputs for the calculator, calculated results, and UI state. We need a predictable and maintainable way to manage this state.
*   **Decision:** We will use Zustand for global state management. For local component state, React's built-in `useState` and `useReducer` hooks will be used where appropriate.
*   **Consequences:**
    *   **Pros:** Zustand is lightweight and has a simple API, reducing boilerplate compared to Redux. Uses hooks-based API familiar to React developers. Good performance. Doesn't wrap the entire application in a context provider. Supports TypeScript well.
    *   **Cons:** Less widely adopted than Redux (though gaining popularity). Might require more manual setup for middleware or persistence compared to Redux Toolkit. Developer familiarity might be lower than with Context API or Redux.

---

### ADR-014: UI Component Library

*   **Status:** Proposed
*   **Context:** To ensure a consistent, accessible, and polished user experience (a stated priority) and speed up development, using a pre-built UI component library is beneficial.
*   **Decision:** We will use Mantine UI (https://mantine.dev/) as the primary component library.
*   **Consequences:**
    *   **Pros:** Comprehensive set of components and hooks. Excellent TypeScript support. Focus on usability and accessibility. Good documentation. Highly customizable. Offers useful hooks beyond just components (e.g., forms, notifications).
    *   **Cons:** Adds a dependency and increases bundle size. Developers need to learn the library's specific components and APIs. Might impose certain styling conventions. 