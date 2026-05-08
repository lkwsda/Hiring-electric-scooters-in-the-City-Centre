package org.example.service;

import org.example.dao.IssueDAO;
import org.example.dao.ScooterDAO;
import org.example.model.Issue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IssueServiceImpl implements IssueService {

    @Autowired
    private IssueDAO issueDAO;

    @Autowired
    private ScooterDAO scooterDAO;

    @Override
    public void reportIssue(Issue issue) {
        // TODO: Auto-email admin after issue reported?
        System.out.println("[Service] New issue reported for scooter #" + issue.getScooterId());
        issueDAO.addIssue(issue);
    }

    @Override
    public List<Issue> viewAllIssues() {
        return issueDAO.findAllIssues();
    }

    // F14: Resolve issue
    @Override
    @Transactional // Status update + scooter update must be atomic
    public void resolveIssue(int issueId) {
        // Set issue status to 'resolved'
        issueDAO.updateStatus(issueId, "resolved");

        // TODO: Set the corresponding scooter status to 'maintenance'

        System.out.println("[Service] Issue #" + issueId + " has been resolved.");
    }
}