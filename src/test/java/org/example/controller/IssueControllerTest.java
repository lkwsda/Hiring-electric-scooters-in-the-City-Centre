package org.example.controller;

import org.example.model.Issue;
import org.example.service.IssueService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IssueController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("IssueController Unit Tests")
class IssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IssueService issueService;

    @Nested
    @DisplayName("POST /api/issues/report")
    class ReportIssueTests {
        @Test
        @DisplayName("should report issue successfully")
        void shouldReportIssue() throws Exception {
            doNothing().when(issueService).reportIssue(any(Issue.class));

            mockMvc.perform(post("/api/issues/report")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":1,\"scooterId\":2,\"description\":\"Brake failure\",\"priority\":\"high\"}"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("submitted")));
        }
    }

    @Nested
    @DisplayName("GET /api/issues")
    class GetAllIssuesTests {
        @Test
        @DisplayName("should return all issues")
        void shouldReturnAllIssues() throws Exception {
            when(issueService.viewAllIssues()).thenReturn(Arrays.asList(new Issue(), new Issue()));

            mockMvc.perform(get("/api/issues"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("PUT /api/issues/resolve/{issueId}")
    class ResolveIssueTests {
        @Test
        @DisplayName("should resolve issue")
        void shouldResolveIssue() throws Exception {
            doNothing().when(issueService).resolveIssue(10);

            mockMvc.perform(put("/api/issues/resolve/10"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("resolved")));
        }
    }

    @Nested
    @DisplayName("Error response paths (400 via GlobalExceptionHandler)")
    class ErrorResponseTests {
        @Test
        @DisplayName("should return 400 when reportIssue service throws")
        void shouldReturn400OnReportIssueError() throws Exception {
            doThrow(new RuntimeException("Validation Failed: Invalid scooter ID"))
                    .when(issueService).reportIssue(any(Issue.class));

            mockMvc.perform(post("/api/issues/report")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":1,\"scooterId\":9999,\"description\":\"Broken\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Validation Failed: Invalid scooter ID"));
        }

        @Test
        @DisplayName("should return 400 when resolveIssue service throws")
        void shouldReturn400OnResolveIssueError() throws Exception {
            doThrow(new RuntimeException("Issue not found"))
                    .when(issueService).resolveIssue(9999);

            mockMvc.perform(put("/api/issues/resolve/9999"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Issue not found"));
        }
    }
}
