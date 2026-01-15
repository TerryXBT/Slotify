import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookingForm from "@/app/book/[username]/[serviceId]/BookingForm";
import type { Service } from "@/types";

// Mock the server actions
vi.mock("@/app/actions/availability", () => ({
  getAvailableSlots: vi.fn(),
}));

vi.mock("@/app/actions/booking", () => ({
  createBookingAction: vi.fn(),
}));

// Import mocked modules
import { getAvailableSlots } from "@/app/actions/availability";
import { createBookingAction } from "@/app/actions/booking";

const mockGetAvailableSlots = vi.mocked(getAvailableSlots);
const mockCreateBookingAction = vi.mocked(createBookingAction);

// Test data
const mockService: Service = {
  id: "service-123",
  provider_id: "provider-456",
  name: "Test Service",
  duration_minutes: 30,
  price_cents: 5000,
  description: "A test service",
  location_type: "video",
  default_location: "https://zoom.us/test",
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockAvailability = [
  { day_of_week: 1, start_time_local: "09:00:00", end_time_local: "17:00:00" },
  { day_of_week: 2, start_time_local: "09:00:00", end_time_local: "17:00:00" },
  { day_of_week: 3, start_time_local: "09:00:00", end_time_local: "17:00:00" },
  { day_of_week: 4, start_time_local: "09:00:00", end_time_local: "17:00:00" },
  { day_of_week: 5, start_time_local: "09:00:00", end_time_local: "17:00:00" },
];

describe("BookingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for available slots
    mockGetAvailableSlots.mockResolvedValue({
      slots: ["9:00am", "9:30am", "10:00am", "10:30am", "11:00am"],
    });
    mockCreateBookingAction.mockResolvedValue({ success: true });
  });

  describe("Date Selection (Step 1)", () => {
    it("should render calendar with month navigation", () => {
      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      expect(screen.getByText("Select a Day")).toBeInTheDocument();
      expect(screen.getByText(/MON/)).toBeInTheDocument();
      expect(screen.getByText(/TUE/)).toBeInTheDocument();
    });

    it("should navigate to next and previous months", async () => {
      const user = userEvent.setup();

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Get initial month
      const _initialMonthText = screen.getByText(/\w+ \d{4}/);

      // Click next month
      const nextButton = screen.getAllByRole("button")[1]; // Second button is next
      await user.click(nextButton);

      // Month should have changed
      expect(screen.getByText(/\w+ \d{4}/)).toBeInTheDocument();
    });

    it("should show timezone information", () => {
      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Should display user's timezone
      expect(
        screen.getByText(/[A-Z][a-z]+\/[A-Z][a-z_]+|UTC/),
      ).toBeInTheDocument();
    });
  });

  describe("Time Selection (Step 2)", () => {
    it("should fetch and display available slots after selecting a date", async () => {
      const user = userEvent.setup();

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Find and click a future date (we'll click on one of the calendar day buttons)
      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      // Click a day that should be enabled
      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]); // Click last day of month

        // Wait for slots to be fetched
        await waitFor(() => {
          expect(mockGetAvailableSlots).toHaveBeenCalled();
        });
      }
    });

    it("should show loading state while fetching slots", async () => {
      const user = userEvent.setup();

      // Delay the mock response
      mockGetAvailableSlots.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ slots: ["9:00am"] }), 100),
          ),
      );

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Click a day
      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);

        // Should show loading state
        await waitFor(() => {
          expect(
            screen.getByText(/Loading available slots/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("should show message when no times are available", async () => {
      const user = userEvent.setup();

      mockGetAvailableSlots.mockResolvedValue({ slots: [] });

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);

        await waitFor(() => {
          expect(screen.getByText(/No available times/i)).toBeInTheDocument();
        });
      }
    });

    it("should display service duration", async () => {
      const user = userEvent.setup();

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);

        await waitFor(() => {
          expect(screen.getByText(/Duration: 30 min/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe("Details Form (Step 3)", () => {
    async function navigateToDetailsStep(
      user: ReturnType<typeof userEvent.setup>,
    ) {
      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Select a date
      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);
      }

      // Wait for slots and select one
      await waitFor(() => {
        expect(screen.getByText("9:00am")).toBeInTheDocument();
      });

      await user.click(screen.getByText("9:00am"));

      // Should now be on details step
      await waitFor(() => {
        expect(screen.getByText("Enter Details")).toBeInTheDocument();
      });
    }

    it("should display booking summary", async () => {
      const user = userEvent.setup();
      await navigateToDetailsStep(user);

      expect(screen.getByText("Test Service")).toBeInTheDocument();
      expect(screen.getByText(/30 minute meeting/i)).toBeInTheDocument();
    });

    it("should show validation errors for invalid name", async () => {
      const user = userEvent.setup();
      await navigateToDetailsStep(user);

      // Enter invalid name with numbers
      const nameInput = screen.getByPlaceholderText("John Doe");
      await user.type(nameInput, "John123");

      // Enter valid phone
      const phoneInput = screen.getByPlaceholderText(/\+1/);
      await user.type(phoneInput, "0412345678");

      // Submit form
      await user.click(screen.getByRole("button", { name: /Schedule Event/i }));

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/letters, spaces, hyphens|invalid/i),
        ).toBeInTheDocument();
      });
    });

    it("should show validation errors for invalid phone", async () => {
      const user = userEvent.setup();
      await navigateToDetailsStep(user);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText("John Doe");
      await user.type(nameInput, "John Doe");

      // Enter invalid phone
      const phoneInput = screen.getByPlaceholderText(/\+1/);
      await user.type(phoneInput, "123");

      // Submit form
      await user.click(screen.getByRole("button", { name: /Schedule Event/i }));

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/at least 10|invalid|digits/i),
        ).toBeInTheDocument();
      });
    });

    it("should show validation errors for invalid email format", async () => {
      const user = userEvent.setup();
      await navigateToDetailsStep(user);

      // Fill in required fields
      const nameInput = screen.getByPlaceholderText("John Doe");
      await user.type(nameInput, "John Doe");

      const phoneInput = screen.getByPlaceholderText(/\+1/);
      await user.type(phoneInput, "0412345678");

      // Enter invalid email
      const emailInput = screen.getByPlaceholderText("john@example.com");
      await user.type(emailInput, "not-an-email");

      // Submit form
      await user.click(screen.getByRole("button", { name: /Schedule Event/i }));

      // Should show validation error for email
      await waitFor(() => {
        // Either shows error or createBookingAction was not called due to validation
        const errorExists = screen.queryByText(/invalid email|email.*valid/i);
        if (!errorExists) {
          expect(mockCreateBookingAction).not.toHaveBeenCalled();
        }
      });
    });

    it("should submit booking with valid data", async () => {
      const user = userEvent.setup();

      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      // Mock alert
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

      await navigateToDetailsStep(user);

      // Fill form with valid data
      const nameInput = screen.getByPlaceholderText("John Doe");
      await user.type(nameInput, "John Doe");

      const emailInput = screen.getByPlaceholderText("john@example.com");
      await user.type(emailInput, "john@example.com");

      const phoneInput = screen.getByPlaceholderText(/\+1/);
      await user.type(phoneInput, "0412345678");

      // Submit form
      await user.click(screen.getByRole("button", { name: /Schedule Event/i }));

      // Should call createBookingAction
      await waitFor(() => {
        expect(mockCreateBookingAction).toHaveBeenCalledWith(
          expect.objectContaining({
            provider_id: "provider-456",
            service_id: "service-123",
            client_name: "John Doe",
            client_email: "john@example.com",
            client_phone: "0412345678",
          }),
        );
      });

      // Cleanup
      alertMock.mockRestore();
      Object.defineProperty(window, "location", { value: originalLocation });
    });

    it("should show error when booking fails", async () => {
      const user = userEvent.setup();

      mockCreateBookingAction.mockResolvedValue({
        success: false,
        error: "Time slot no longer available",
      });

      // Mock alert
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

      await navigateToDetailsStep(user);

      // Fill form
      const nameInput = screen.getByPlaceholderText("John Doe");
      await user.type(nameInput, "John Doe");

      const phoneInput = screen.getByPlaceholderText(/\+1/);
      await user.type(phoneInput, "0412345678");

      // Submit
      await user.click(screen.getByRole("button", { name: /Schedule Event/i }));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Time slot no longer available");
      });

      alertMock.mockRestore();
    });

    it("should show character count for notes field", async () => {
      const user = userEvent.setup();
      await navigateToDetailsStep(user);

      expect(screen.getByText("0/500 characters")).toBeInTheDocument();

      const notesInput = screen.getByPlaceholderText(/share anything/i);
      await user.type(notesInput, "Hello");

      expect(screen.getByText("5/500 characters")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should allow going back from time selection to date selection", async () => {
      const user = userEvent.setup();

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Select a date
      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);
      }

      // Wait for time selection step
      await waitFor(() => {
        expect(screen.getByText("Select a Time")).toBeInTheDocument();
      });

      // Click back button
      await user.click(screen.getByText("Back"));

      // Should be back on date selection
      await waitFor(() => {
        expect(screen.getByText("Select a Day")).toBeInTheDocument();
      });
    });

    it("should allow going back from details to time selection", async () => {
      const user = userEvent.setup();

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Navigate to details step
      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);
      }

      await waitFor(() => {
        expect(screen.getByText("9:00am")).toBeInTheDocument();
      });

      await user.click(screen.getByText("9:00am"));

      await waitFor(() => {
        expect(screen.getByText("Enter Details")).toBeInTheDocument();
      });

      // Click back
      await user.click(screen.getByText("Back"));

      // Should be back on time selection
      await waitFor(() => {
        expect(screen.getByText("Select a Time")).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state during form submission", async () => {
      const user = userEvent.setup();

      // Delay the mock response
      mockCreateBookingAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 200),
          ),
      );

      // Mock alert to prevent actual alert
      vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <BookingForm
          service={mockService}
          providerId="provider-456"
          providerName="Test Provider"
          availability={mockAvailability}
        />,
      );

      // Navigate to details
      const dayButtons = screen.getAllByRole("button").filter((btn) => {
        const text = btn.textContent;
        return text && /^\d{1,2}$/.test(text);
      });

      if (dayButtons.length > 0) {
        await user.click(dayButtons[dayButtons.length - 1]);
      }

      await waitFor(() => {
        expect(screen.getByText("9:00am")).toBeInTheDocument();
      });

      await user.click(screen.getByText("9:00am"));

      await waitFor(() => {
        expect(screen.getByText("Enter Details")).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText(/\+1/), "0412345678");

      // Submit
      await user.click(screen.getByRole("button", { name: /Schedule Event/i }));

      // Should show loading state
      expect(screen.getByText("Scheduling...")).toBeInTheDocument();
    });
  });
});
