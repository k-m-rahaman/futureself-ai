import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("landing preview switches between three paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your Future Has More Than One Version." })).toBeVisible();

  const preview = page.getByRole("button", { name: "Startup", exact: true });
  await preview.click();
  await expect(preview).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".fs-preview-bottom")).toContainText("Interview potential users");
  await expect(page.getByRole("button", { name: "AI / ML", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("student demo adapts to five weekly hours and saves roadmap progress", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open demo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Future Explorer" })).toBeVisible();

  const weeklyHours = page.getByRole("slider", { name: /Weekly availability/i });
  const availability = page.locator(".what-if-readout");
  await expect(weeklyHours).toHaveValue("12");
  await expect(availability).toContainText("312 hours available");
  for (let step = 0; step < 7; step += 1) await weeklyHours.press("ArrowLeft");
  await expect(weeklyHours).toHaveValue("5");
  await expect(availability).toContainText("130 hours available");
  await expect(availability).toContainText("Assumptions changed");

  const paths = page.getByRole("group", { name: "Select a path" });
  const path = paths.getByRole("button", { name: "Algorithms & DSA" });
  await path.click();
  await expect(path).toHaveAttribute("aria-pressed", "true");
  await expect(availability).toContainText("The full plan needs 40 more hours");
  await expect(availability).toContainText("need a new date or smaller scope");
  await expect(availability).toContainText("Build a practice rhythm");
  await expect(availability).toContainText("6.6h/week");
  await page.getByRole("button", { name: "Future voice" }).click();
  await page.getByRole("button", { name: "What should I do this week?" }).click();
  await expect(page.getByText("POSSIBLE FUTURE SELF", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compare paths" }).click();
  await expect(page.getByRole("heading", { name: "Compare paths" })).toBeVisible();
  const experiment = page.getByRole("region", { name: "What should I test this week?" });
  await expect(experiment).toContainText("90 min per path");
  await experiment.getByLabel("Second path").selectOption({ label: "Entrepreneurship" });
  await expect(experiment.getByRole("heading", { name: "Entrepreneurship" })).toBeVisible();
  await page.clock.setFixedTime(new Date("2030-06-10T12:00:00Z"));
  await experiment.locator("summary").filter({ hasText: "Find time this week" }).click();
  await experiment.getByLabel("Available date", { exact: true }).fill("2030-06-11");
  await experiment.getByLabel("Available from", { exact: true }).fill("13:00");
  await experiment.getByLabel("Available until", { exact: true }).fill("15:00");
  await experiment.getByRole("button", { name: "Add work window", exact: true }).click();
  await experiment.getByLabel("Busy date", { exact: true }).fill("2030-06-11");
  await experiment.getByLabel("Busy from", { exact: true }).fill("13:30");
  await experiment.getByLabel("Busy until", { exact: true }).fill("14:00");
  await experiment.getByRole("button", { name: "Add busy block", exact: true }).click();
  await experiment.getByRole("button", { name: "Find times", exact: true }).click();
  await expect(experiment.getByRole("heading", { name: "Two 30-minute sessions" })).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await experiment.getByRole("button", { name: "Download both (.ics)", exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toMatch(/\.ics$/);
  const calendar = await readFile(await file.path(), "utf8");
  expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  expect(calendar).toContain("Algorithms & DSA");
  expect(calendar).toContain("Entrepreneurship");
  await expect(page.getByRole("region", { name: "Estimated effort chart" })).toContainText("130 h available");
  await page.getByRole("button", { name: "Build roadmap", exact: true }).nth(1).click();
  await expect(page).toHaveURL(/\/roadmap/);
  await expect(page.getByRole("heading", { name: "30-day roadmap" })).toBeVisible();

  const firstTask = page.getByRole("checkbox").first();
  await firstTask.check();
  await expect(firstTask).toBeChecked();
  await page.reload();
  await expect(firstTask).toBeChecked();

  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Decision history" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open decision" }).first()).toBeVisible();
});




test("mobile Studio submission and Reality Check update an offline roadmap", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const noHorizontalOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await expect.poll(noHorizontalOverflow).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-landing.png"), animations: "disabled" });
  await page.getByRole("link", { name: "Explore My Futures", exact: true }).first().click();

  await expect(page.getByRole("heading", { name: "Start with one decision." })).toBeVisible();
  await page.getByRole("button", { name: "Student", exact: true }).click();
  await expect(page.getByLabel("What decision are you facing?")).toHaveValue(/AI\/ML/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your direction" })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Hours per week")).toHaveValue("12");
  await page.getByLabel("Total budget (USD)").fill("3000000");

  const generated = page.waitForResponse(response => response.url().endsWith("/api/scenarios") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Explore my futures", exact: true }).click();
  const result = await generated;
  expect(result.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Future Explorer" })).toBeVisible();
  await expect(page.getByText("Offline template", { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Select a path" }).getByRole("button")).toHaveCount(3);
  await expect.poll(noHorizontalOverflow).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-explore.png"), animations: "disabled" });

  await page.getByLabel("Budget (USD)").fill("2000000");
  await page.getByRole("button", { name: "Build this roadmap", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reality Check" })).toBeVisible();
  await expect(page.getByLabel("Budget (USD)")).toHaveValue("2000000");
  const observation = "I ran a baseline, but exams reduced my weekly availability.";
  await page.getByLabel("What happened?").fill(observation);
  await page.getByLabel("Hours per week").fill("5");
  const assumption = page.getByRole("checkbox", { name: "You can use a public dataset and work locally on a CPU." });
  await assumption.check();
  await page.getByRole("button", { name: "Update roadmap", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check-in saved");
  await expect(page.getByText("5 h/week", { exact: true })).toBeVisible();
  await expect(page.getByText(/Weekly hours: 12 → 5/)).toBeVisible();
  await expect(page.getByText("What changed", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("What happened?")).toHaveValue(observation);
  await expect(assumption).toBeChecked();
});
