
type MockResponse = { headers: Headers; body: string };

export function parseCurlLog(log: string): MockResponse {
  const [headerPart, body] = log.split(/\n\n(.+)/s);
  const headers = headerPart.split("\n").reduce((acc, line) => {
    const [key, value] = line.split(/: /s);
    if (key && value) {
      acc.append(key.toLowerCase(), value);
    }
    return acc;
  }, new Headers());

  return { headers, body: body.trim() };
}

export function createFetchMock(payload: MockResponse): typeof fetch {
  const separator = "\n\n";
  // Split on double newlines and encode each event
  const encodedEvents = payload.body
    .trim()
    .split(separator)

  const mockFetch:typeof fetch = (
    requestInfo: RequestInfo | URL,
    requestInit?: RequestInit
  ) => {
    if (!requestInfo && !requestInit) {
      throw new TypeError("Invalid arguments");
    }
    const ret = new Response(
      new ReadableStream({
        async start(controller) {
          for (const event of encodedEvents) {
            controller.enqueue(new TextEncoder().encode(event + separator));
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
          controller.close();
        },
      }),
      {
        headers: payload.headers,
      }
    );
    return Promise.resolve(ret);
  };
  return mockFetch
}
