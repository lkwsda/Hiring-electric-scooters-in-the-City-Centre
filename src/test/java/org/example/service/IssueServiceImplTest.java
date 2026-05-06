package org.example.service;

import org.example.dao.IssueDAO;
import org.example.model.Issue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("IssueService Unit Tests")
class IssueServiceImplTest {

    @Mock
    private IssueDAO issueDAO;

    @InjectMocks
    private IssueServiceImpl issueService;

    @Nested
    @DisplayName("reportIssue")
    class ReportIssueTests {
        @Test
        @DisplayName("should delegate to DAO")
        void shouldDelegateToDAO() {
            Issue issue = new Issue();
            issue.setUserId(1);
            issue.setScooterId(2);
            issue.setDescription("Brake failure");
            issue.setPriority("high");

            issueService.reportIssue(issue);
            verify(issueDAO).addIssue(issue);
        }
    }

    @Nested
    @DisplayName("viewAllIssues")
    class ViewAllIssuesTests {
        @Test
        @DisplayName("should return all issues from DAO")
        void shouldReturnAllIssues() {
            List<Issue> issues = Arrays.asList(new Issue(), new Issue());
            when(issueDAO.findAllIssues()).thenReturn(issues);

            List<Issue> result = issueService.viewAllIssues();
            assertEquals(2, result.size());
        }
    }

    @Nested
    @DisplayName("resolveIssue")
    class ResolveIssueTests {
        @Test
        @DisplayName("should mark issue as resolved")
        void shouldMarkIssueAsResolved() {
            issueService.resolveIssue(10);
            verify(issueDAO).updateStatus(10, "resolved");
        }
    }
}
