package org.example.dao;

import org.example.model.Issue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Transactional
@DisplayName("IssueDAO Integration Tests")
class IssueDAOImplTest {

    @Autowired
    private IssueDAO issueDAO;

    @Nested
    @DisplayName("addIssue")
    class AddIssueTests {
        @Test
        @DisplayName("should persist new issue")
        void shouldPersistNewIssue() {
            Issue issue = new Issue();
            issue.setUserId(1);
            issue.setScooterId(2);
            issue.setDescription("Brake not working");
            issue.setPriority("high");

            issueDAO.addIssue(issue);

            List<Issue> issues = issueDAO.findAllIssues();
            assertEquals(1, issues.size());
            assertEquals("Brake not working", issues.get(0).getDescription());
            assertEquals("high", issues.get(0).getPriority());
            assertEquals("pending", issues.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("findAllIssues")
    class FindAllIssuesTests {
        @Test
        @DisplayName("should return empty list when no issues exist")
        void shouldReturnEmptyListWhenNoIssues() {
            List<Issue> issues = issueDAO.findAllIssues();
            assertNotNull(issues);
            assertTrue(issues.isEmpty());
        }

        @Test
        @DisplayName("should return all reported issues")
        void shouldReturnAllReportedIssues() {
            Issue issue1 = new Issue();
            issue1.setUserId(1);
            issue1.setScooterId(1);
            issue1.setDescription("First issue");
            issue1.setPriority("low");
            issueDAO.addIssue(issue1);

            Issue issue2 = new Issue();
            issue2.setUserId(2);
            issue2.setScooterId(2);
            issue2.setDescription("Second issue");
            issue2.setPriority("high");
            issueDAO.addIssue(issue2);

            List<Issue> issues = issueDAO.findAllIssues();
            assertEquals(2, issues.size());
            assertTrue(issues.stream().anyMatch(i -> "First issue".equals(i.getDescription())));
            assertTrue(issues.stream().anyMatch(i -> "Second issue".equals(i.getDescription())));
        }
    }

    @Nested
    @DisplayName("updateStatus")
    class UpdateStatusTests {
        @Test
        @DisplayName("should update issue status to in_progress")
        void shouldUpdateStatusToInProgress() {
            Issue issue = new Issue();
            issue.setUserId(1);
            issue.setScooterId(1);
            issue.setDescription("Flat tire");
            issue.setPriority("medium");
            issueDAO.addIssue(issue);

            List<Issue> issues = issueDAO.findAllIssues();
            int issueId = issues.get(0).getId();

            issueDAO.updateStatus(issueId, "in_progress");

            List<Issue> updated = issueDAO.findAllIssues();
            assertEquals("in_progress", updated.get(0).getStatus());
        }

        @Test
        @DisplayName("should update issue status to resolved")
        void shouldUpdateStatusToResolved() {
            Issue issue = new Issue();
            issue.setUserId(2);
            issue.setScooterId(3);
            issue.setDescription("Battery dead");
            issue.setPriority("high");
            issueDAO.addIssue(issue);

            List<Issue> issues = issueDAO.findAllIssues();
            int issueId = issues.get(0).getId();

            issueDAO.updateStatus(issueId, "resolved");

            List<Issue> updated = issueDAO.findAllIssues();
            assertEquals("resolved", updated.get(0).getStatus());
        }

        @Test
        @DisplayName("should not throw when updating non-existent issue")
        void shouldNotThrowForNonExistentIssue() {
            assertDoesNotThrow(() -> issueDAO.updateStatus(9999, "resolved"));
        }
    }
}
