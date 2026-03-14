/**
 * Component tests for the offline banner.
 */
import { render, screen, act } from "@testing-library/react";
import { OfflineBanner } from "@/components/offline-banner";

// Helper to fire online/offline events
function fireNetworkEvent(type: "online" | "offline") {
  act(() => {
    window.dispatchEvent(new Event(type));
  });
}

// Override navigator.onLine
function mockOnLine(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

describe("OfflineBanner", () => {
  afterEach(() => {
    mockOnLine(true);
  });

  it("renders nothing when online", () => {
    mockOnLine(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the banner when navigator.onLine is false at mount", () => {
    mockOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it("shows the banner after an offline event", () => {
    mockOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    mockOnLine(false);
    fireNetworkEvent("offline");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("hides the banner after an online event", () => {
    mockOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    mockOnLine(true);
    fireNetworkEvent("online");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
