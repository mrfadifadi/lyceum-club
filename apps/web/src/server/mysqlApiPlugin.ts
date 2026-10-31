import type { Plugin, ViteDevServer } from "vite";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import type { IncomingMessage, ServerResponse } from "node:http";

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const dbConfig: DbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "lyceum",
};

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.end(JSON.stringify(data));
}

let schemaChecked = false;

async function checkSchema(db: mysql.Pool) {
  if (schemaChecked) return;
  schemaChecked = true;
  try {
    await db.query("ALTER TABLE users ADD COLUMN photo_url TEXT NULL");
  } catch {}

  try {
    await db.query("ALTER TABLE users ADD COLUMN major VARCHAR(200) NULL");
  } catch {}

  try {
    // Populate major from membership_applications if available
    await db.query(`
      UPDATE users u
      JOIN membership_applications m ON LOWER(u.email) = LOWER(m.email)
      SET u.major = m.major
      WHERE u.major IS NULL OR u.major = ''
    `);
  } catch {}

  try {
    // Set a default major for any users still missing one
    await db.query(`
      UPDATE users SET major = 'Computer Science & AI' WHERE major IS NULL OR major = ''
    `);
  } catch {}

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS partner_companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        logo_url TEXT NOT NULL,
        category VARCHAR(100) NULL,
        default_discount VARCHAR(50) NOT NULL DEFAULT '15% OFF',
        description TEXT NULL,
        website VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    console.error("Failed creating partner_companies:", e);
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS member_discounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        company_id INT NOT NULL,
        discount_rate VARCHAR(50) NOT NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY user_company_uniq (user_id, company_id),
        CONSTRAINT fk_md_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_md_company FOREIGN KEY (company_id) REFERENCES partner_companies (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    console.error("Failed creating member_discounts:", e);
  }

  // Seed partner companies if empty
  try {
    const [existing] = await db.query<any[]>("SELECT COUNT(*) as cnt FROM partner_companies");
    if (existing[0]?.cnt === 0) {
      await db.query(`
        INSERT INTO partner_companies (name, logo_url, category, default_discount, description, website) VALUES
        ('Batna Cyber Tech', '/partners/cyber-tech.svg', 'Tech & Hardware', '20% OFF', 'Official IT hardware, laptops, and peripherals convention for Lyceum members.', 'https://cybertech.dz'),
        ('Impression El Amel', '/partners/el-amel-print.svg', 'Printing & Academia', '35% OFF', 'Thesis binding, academic printing, posters, and club documents center.', 'https://elamel-print.dz'),
        ('Cambridge Language Hub', '/partners/cambridge-lang.svg', 'Languages & Testing', '25% OFF', 'English certification, TOEFL, IELTS preparation, and intensive workshops.', 'https://cambridge-batna.dz'),
        ('The Hive Coworking', '/partners/the-hive.svg', 'Coworking & Coffee', '40% OFF', 'Modern workspace, high-speed fiber internet, private booths, and study cafe.', 'https://thehive-batna.dz'),
        ('Librairie Universitaire', '/partners/librairie-univ.svg', 'Textbooks & Supplies', '30% OFF', 'Scientific references, architecture supplies, books, and stationery.', 'https://librairie-univ.dz'),
        ('Olympia Sports & Gym', '/partners/olympia-fitness.svg', 'Fitness & Wellness', '50% OFF', 'Modern gym facilities, fitness training, swimming, and student wellness passes.', 'https://olympiagym.dz')
      `);

      // Seed sample custom discounts for existing users
      const [userRows] = await db.query<any[]>("SELECT id FROM users LIMIT 10");
      for (const u of userRows) {
        await db.query(`
          INSERT IGNORE INTO member_discounts (user_id, company_id, discount_rate, notes) VALUES
          (?, 1, '20% OFF', 'Official Lyceum Tech Partner'),
          (?, 4, '40% OFF', 'Lyceum Coworking Convention')
        `, [u.id, u.id]);
      }
    }
  } catch (e) {
    console.error("Failed seeding partner_companies:", e);
  }
}

export function mysqlApiPlugin(): Plugin {
  return {
    name: "mysql-api-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] || "";

        // Handle CORS preflight
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
          return res.end();
        }

        // Only handle /api/v1/ endpoints
        if (!url.startsWith("/api/v1/")) {
          return next();
        }

        try {
          const db = getPool();
          await checkSchema(db);

          // 1. Health check
          if (url === "/api/v1/health") {
            await db.query("SELECT 1");
            return sendJson(res, 200, { status: "ok", database: "connected (mysql)" });
          }

          // 2. Login: POST /api/v1/login
          if (url === "/api/v1/login" && req.method === "POST") {
            const body = await parseJsonBody(req);
            const email = (body.email || "").toString().trim().toLowerCase();
            const password = (body.password || "").toString();

            if (!email || !password) {
              return sendJson(res, 422, { detail: "Email and password are required" });
            }

            const [rows] = await db.query<any[]>(
              "SELECT id, full_name, email, password_hash, role, is_active, created_at, photo_url, major FROM users WHERE LOWER(email) = ? LIMIT 1",
              [email]
            );

            if (!rows || rows.length === 0) {
              return sendJson(res, 401, { detail: "Invalid email or password" });
            }

            const user = rows[0];

            let passwordValid = false;
            if (user.password_hash.startsWith("$2y$") || user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
              const standardHash = user.password_hash.replace(/^\$2y\$/, "$2a$");
              passwordValid = await bcrypt.compare(password, standardHash);
            } else {
              passwordValid = await bcrypt.compare(password, user.password_hash);
            }

            if (!passwordValid) {
              return sendJson(res, 401, { detail: "Invalid email or password" });
            }

            if (!user.is_active) {
              return sendJson(res, 403, { detail: "User account is not confirmed" });
            }

            const tokenPayload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role, email: user.email, exp: Date.now() + 1800000 })).toString("base64");
            const token = `ey.lyceum.${tokenPayload}.sig`;

            return sendJson(res, 200, {
              access_token: token,
              token_type: "bearer",
              expires_in: 1800,
              user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                is_active: Boolean(user.is_active),
                created_at: user.created_at,
                photo_url: user.photo_url || null,
                major: user.major || "Computer Science & AI",
              },
            });
          }

          // 3. Submit Membership Application: POST /api/v1/applications
          if (url === "/api/v1/applications" && req.method === "POST") {
            const body = await parseJsonBody(req);
            const {
              first_name,
              last_name,
              email,
              phone,
              university,
              major,
              academic_year,
              motivation,
              skills_interests,
            } = body;

            if (!first_name || !last_name || !email || !phone || !university || !major || !academic_year || !motivation) {
              return sendJson(res, 422, { detail: "All required application fields must be provided" });
            }

            const normalizedEmail = email.toString().trim().toLowerCase();

            const [existing] = await db.query<any[]>(
              "SELECT id FROM membership_applications WHERE LOWER(email) = ? LIMIT 1",
              [normalizedEmail]
            );

            if (existing && existing.length > 0) {
              return sendJson(res, 409, { detail: "An application with this email already exists" });
            }

            const [result] = await db.query<any>(
              `INSERT INTO membership_applications 
                (first_name, last_name, email, phone, university, major, academic_year, motivation, skills_interests, status, hr_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
              [
                first_name.trim(),
                last_name.trim(),
                normalizedEmail,
                phone.trim(),
                university.trim(),
                major.trim(),
                academic_year.trim(),
                motivation.trim(),
                (skills_interests || "").toString().trim(),
              ]
            );

            return sendJson(res, 201, {
              id: result.insertId,
              first_name,
              last_name,
              email: normalizedEmail,
              status: "pending",
              hr_status: "pending",
              message: "Application submitted successfully and sent to HR for review.",
            });
          }

          // 4. List Applications: GET /api/v1/applications
          if (url === "/api/v1/applications" && req.method === "GET") {
            const [rows] = await db.query("SELECT * FROM membership_applications ORDER BY created_at DESC");
            return sendJson(res, 200, rows);
          }

          // 5. HR Review: POST /api/v1/applications/:id/hr-review
          const hrMatch = url.match(/^\/api\/v1\/applications\/(\d+)\/hr-review$/);
          if (hrMatch && req.method === "POST") {
            const appId = Number(hrMatch[1]);
            const body = await parseJsonBody(req);
            const { action, reason } = body;

            if (action !== "approve" && action !== "reject") {
              return sendJson(res, 422, { detail: "Action must be 'approve' or 'reject'" });
            }

            if (action === "reject" && (!reason || !reason.trim())) {
              return sendJson(res, 422, { detail: "A reason is required when HR rejects an application." });
            }

            const newHrStatus = action === "approve" ? "approved" : "rejected";
            const newOverallStatus = action === "reject" ? "rejected" : "pending";
            const rejectionReason = action === "reject" ? reason.trim() : null;

            await db.query(
              `UPDATE membership_applications 
               SET hr_status = ?, hr_rejection_reason = ?, status = ?, hr_reviewed_at = NOW() 
               WHERE id = ?`,
              [newHrStatus, rejectionReason, newOverallStatus, appId]
            );

            const [updated] = await db.query<any[]>("SELECT * FROM membership_applications WHERE id = ?", [appId]);
            return sendJson(res, 200, updated[0]);
          }

          // 6. President Review: POST /api/v1/applications/:id/president-review
          const presMatch = url.match(/^\/api\/v1\/applications\/(\d+)\/president-review$/);
          if (presMatch && req.method === "POST") {
            const appId = Number(presMatch[1]);
            const body = await parseJsonBody(req);
            const { action } = body;

            if (action !== "approve" && action !== "reject") {
              return sendJson(res, 422, { detail: "Action must be 'approve' or 'reject'" });
            }

            const [appRows] = await db.query<any[]>("SELECT * FROM membership_applications WHERE id = ?", [appId]);
            if (!appRows || appRows.length === 0) {
              return sendJson(res, 404, { detail: "Application not found" });
            }

            const application = appRows[0];
            if (application.hr_status !== "approved") {
              return sendJson(res, 400, { detail: "Application has not been approved by HR yet." });
            }

            const presStatus = action === "approve" ? "approved" : "rejected";
            const finalStatus = presStatus;

            await db.query(
              `UPDATE membership_applications 
               SET president_status = ?, status = ?, president_reviewed_at = NOW(), reviewed_at = NOW() 
               WHERE id = ?`,
              [presStatus, finalStatus, appId]
            );

            // If President approves, automatically create a member user account if not already registered
            if (action === "approve") {
              const [userCheck] = await db.query<any[]>("SELECT id FROM users WHERE LOWER(email) = ?", [application.email.toLowerCase()]);
              if (!userCheck || userCheck.length === 0) {
                const defaultHash = await bcrypt.hash("member123456", 10);
                await db.query(
                  `INSERT INTO users (full_name, email, password_hash, role, is_active, major) 
                   VALUES (?, ?, ?, 'member', 1, ?)`,
                  [`${application.first_name} ${application.last_name}`, application.email.toLowerCase(), defaultHash, application.major || null]
                );
              }
            }

            const [updated] = await db.query<any[]>("SELECT * FROM membership_applications WHERE id = ?", [appId]);
            return sendJson(res, 200, updated[0]);
          }

          // 7. Delete Application: DELETE /api/v1/applications/:id
          const delAppMatch = url.match(/^\/api\/v1\/applications\/(\d+)$/);
          if (delAppMatch && req.method === "DELETE") {
            const appId = Number(delAppMatch[1]);
            await db.query("DELETE FROM membership_applications WHERE id = ?", [appId]);
            return sendJson(res, 200, { message: "Application deleted successfully" });
          }

          // 8. List Users: GET /api/v1/users
          if (url === "/api/v1/users" && req.method === "GET") {
            const [rows] = await db.query("SELECT id, full_name, email, role, is_active, created_at, photo_url, major FROM users ORDER BY id ASC");
            return sendJson(res, 200, rows);
          }

          // 8b. Single User: GET /api/v1/users/:id
          const userGetMatch = url.match(/^\/api\/v1\/users\/(\d+)$/);
          if (userGetMatch && req.method === "GET") {
            const userId = Number(userGetMatch[1]);
            const [rows] = await db.query<any[]>(
              "SELECT id, full_name, email, role, is_active, created_at, photo_url, major FROM users WHERE id = ? LIMIT 1",
              [userId]
            );
            if (!rows || rows.length === 0) {
              return sendJson(res, 404, { detail: "User not found" });
            }
            return sendJson(res, 200, rows[0]);
          }

          // 8c. Create User: POST /api/v1/users
          if (url === "/api/v1/users" && req.method === "POST") {
            const body = await parseJsonBody(req);
            const { full_name, email, password, role = "member", is_active = true, major = "Computer Science & AI" } = body;

            if (!full_name || !email || !password) {
              return sendJson(res, 422, { detail: "Full name, email, and password are required." });
            }

            const normalizedEmail = email.toString().trim().toLowerCase();
            const [existing] = await db.query<any[]>("SELECT id FROM users WHERE LOWER(email) = ?", [normalizedEmail]);
            if (existing && existing.length > 0) {
              return sendJson(res, 409, { detail: "A user with this email already exists." });
            }

            const passwordHash = await bcrypt.hash(password.toString(), 10);
            const [insertRes] = await db.query<any>(
              "INSERT INTO users (full_name, email, password_hash, role, is_active, major) VALUES (?, ?, ?, ?, ?, ?)",
              [full_name.trim(), normalizedEmail, passwordHash, role, is_active ? 1 : 0, (major || "").toString().trim() || null]
            );

            const [newUser] = await db.query<any[]>(
              "SELECT id, full_name, email, role, is_active, created_at, photo_url, major FROM users WHERE id = ?",
              [insertRes.insertId]
            );
            return sendJson(res, 201, newUser[0]);
          }

          // 9. Update User: PATCH /api/v1/users/:id
          const userPatchMatch = url.match(/^\/api\/v1\/users\/(\d+)$/);
          if (userPatchMatch && req.method === "PATCH") {
            const userId = Number(userPatchMatch[1]);
            const body = await parseJsonBody(req);
            const { full_name, role, is_active, password, photo_url, major } = body;

            if (full_name) {
              await db.query("UPDATE users SET full_name = ? WHERE id = ?", [full_name.trim(), userId]);
            }
            if (role) {
              await db.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
            }
            if (typeof is_active === "boolean") {
              await db.query("UPDATE users SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, userId]);
            }
            if (password) {
              const hash = await bcrypt.hash(password.toString(), 10);
              await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
            }
            if (photo_url !== undefined) {
              await db.query("UPDATE users SET photo_url = ? WHERE id = ?", [photo_url, userId]);
            }
            if (major !== undefined) {
              await db.query("UPDATE users SET major = ? WHERE id = ?", [(major || "").toString().trim() || null, userId]);
            }

            const [userRows] = await db.query<any[]>("SELECT id, full_name, email, role, is_active, created_at, photo_url, major FROM users WHERE id = ?", [userId]);
            return sendJson(res, 200, userRows[0]);
          }

          // 10. Delete User: DELETE /api/v1/users/:id
          const userDelMatch = url.match(/^\/api\/v1\/users\/(\d+)$/);
          if (userDelMatch && req.method === "DELETE") {
            const userId = Number(userDelMatch[1]);
            await db.query("DELETE FROM users WHERE id = ?", [userId]);
            return sendJson(res, 200, { message: "User deleted successfully" });
          }

          // 11. Partners List: GET /api/v1/partners
          if (url === "/api/v1/partners" && req.method === "GET") {
            const [rows] = await db.query("SELECT * FROM partner_companies ORDER BY id ASC");
            return sendJson(res, 200, rows);
          }

          // 12. Create Partner: POST /api/v1/partners
          if (url === "/api/v1/partners" && req.method === "POST") {
            const body = await parseJsonBody(req);
            const { name, logo_url, category, default_discount = "15% OFF", description, website } = body;
            if (!name || !logo_url) {
              return sendJson(res, 422, { detail: "Company name and logo are required" });
            }
            const [result] = await db.query<any>(
              "INSERT INTO partner_companies (name, logo_url, category, default_discount, description, website) VALUES (?, ?, ?, ?, ?, ?)",
              [
                name.trim(),
                logo_url.trim(),
                category ? category.trim() : null,
                default_discount.trim(),
                description ? description.trim() : null,
                website ? website.trim() : null,
              ]
            );
            const [newCompany] = await db.query<any[]>("SELECT * FROM partner_companies WHERE id = ?", [result.insertId]);
            return sendJson(res, 201, newCompany[0]);
          }

          // 13. Update Partner: PATCH /api/v1/partners/:id
          const partnerPatchMatch = url.match(/^\/api\/v1\/partners\/(\d+)$/);
          if (partnerPatchMatch && req.method === "PATCH") {
            const partnerId = Number(partnerPatchMatch[1]);
            const body = await parseJsonBody(req);
            const { name, logo_url, category, default_discount, description, website } = body;
            if (name) await db.query("UPDATE partner_companies SET name = ? WHERE id = ?", [name.trim(), partnerId]);
            if (logo_url) await db.query("UPDATE partner_companies SET logo_url = ? WHERE id = ?", [logo_url.trim(), partnerId]);
            if (category !== undefined) await db.query("UPDATE partner_companies SET category = ? WHERE id = ?", [category ? category.trim() : null, partnerId]);
            if (default_discount) await db.query("UPDATE partner_companies SET default_discount = ? WHERE id = ?", [default_discount.trim(), partnerId]);
            if (description !== undefined) await db.query("UPDATE partner_companies SET description = ? WHERE id = ?", [description ? description.trim() : null, partnerId]);
            if (website !== undefined) await db.query("UPDATE partner_companies SET website = ? WHERE id = ?", [website ? website.trim() : null, partnerId]);

            const [updated] = await db.query<any[]>("SELECT * FROM partner_companies WHERE id = ?", [partnerId]);
            return sendJson(res, 200, updated[0]);
          }

          // 14. Delete Partner: DELETE /api/v1/partners/:id
          const partnerDelMatch = url.match(/^\/api\/v1\/partners\/(\d+)$/);
          if (partnerDelMatch && req.method === "DELETE") {
            const partnerId = Number(partnerDelMatch[1]);
            await db.query("DELETE FROM partner_companies WHERE id = ?", [partnerId]);
            return sendJson(res, 200, { message: "Partner company deleted successfully" });
          }

          // 15. Get Member Discounts: GET /api/v1/members/:id/discounts
          const memberDiscountsGetMatch = url.match(/^\/api\/v1\/members\/(\d+)\/discounts$/);
          if (memberDiscountsGetMatch && req.method === "GET") {
            const userId = Number(memberDiscountsGetMatch[1]);
            const [rows] = await db.query(
              `SELECT 
                p.id, p.name, p.logo_url, p.category, p.default_discount, p.description, p.website,
                md.discount_rate AS member_discount,
                md.notes AS member_notes,
                md.id AS discount_id
               FROM partner_companies p
               LEFT JOIN member_discounts md ON md.company_id = p.id AND md.user_id = ?
               ORDER BY p.id ASC`,
              [userId]
            );
            return sendJson(res, 200, rows);
          }

          // 16. Assign / Update Member Discount: POST /api/v1/members/:id/discounts
          const memberDiscountPostMatch = url.match(/^\/api\/v1\/members\/(\d+)\/discounts$/);
          if (memberDiscountPostMatch && req.method === "POST") {
            const userId = Number(memberDiscountPostMatch[1]);
            const body = await parseJsonBody(req);
            const { company_id, discount_rate, notes } = body;
            if (!company_id || !discount_rate) {
              return sendJson(res, 422, { detail: "Company ID and discount rate are required" });
            }
            await db.query(
              `INSERT INTO member_discounts (user_id, company_id, discount_rate, notes)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 discount_rate = VALUES(discount_rate),
                 notes = VALUES(notes)`,
              [userId, Number(company_id), discount_rate.toString().trim(), (notes || "").toString().trim() || null]
            );
            return sendJson(res, 200, { message: "Member discount updated successfully" });
          }

          // 17. Remove Member Discount: DELETE /api/v1/members/:userId/discounts/:companyId
          const memberDiscountDelMatch = url.match(/^\/api\/v1\/members\/(\d+)\/discounts\/(\d+)$/);
          if (memberDiscountDelMatch && req.method === "DELETE") {
            const userId = Number(memberDiscountDelMatch[1]);
            const companyId = Number(memberDiscountDelMatch[2]);
            await db.query("DELETE FROM member_discounts WHERE user_id = ? AND company_id = ?", [userId, companyId]);
            return sendJson(res, 200, { message: "Member discount removed successfully" });
          }

          return next();
        } catch (error: any) {
          console.error("API Error:", error);
          if (error.code === "ECONNREFUSED" || error.code === "ER_NOT_SUPPORTED_AUTH_MODE") {
            return sendJson(res, 503, {
              detail: "Cannot connect to MySQL database on 127.0.0.1:3306. Please ensure MySQL in XAMPP is started.",
            });
          }
          return sendJson(res, 500, { detail: error.message || "Internal server error" });
        }
      });
    },
  };
}
