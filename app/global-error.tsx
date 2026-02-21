"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Box, Typography, Button, Container } from "@mui/material";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <Container maxWidth="sm" sx={{ py: 8 }}>
                    <Box
                        sx={{
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            borderRadius: 3,
                            p: 4,
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                color: "#333",
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >
                            Something went wrong
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: "#666",
                                mb: 3,
                                lineHeight: 1.6,
                            }}
                        >
                            We encountered an unexpected error. Please try again.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => reset()}
                            sx={{
                                backgroundColor: "#DE3F5E",
                                color: "white",
                                px: 4,
                                py: 1.5,
                                borderRadius: "24px",
                                textTransform: "none",
                                "&:hover": {
                                    backgroundColor: "#C8365A",
                                },
                            }}
                        >
                            Try Again
                        </Button>
                    </Box>
                </Container>
            </body>
        </html>
    );
}
