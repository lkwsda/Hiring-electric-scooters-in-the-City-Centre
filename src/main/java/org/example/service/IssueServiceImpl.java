package org.example.service;

import org.example.dao.IssueDAO;
import org.example.model.Issue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class IssueServiceImpl implements IssueService {

    @Autowired
    private IssueDAO issueDAO;

    @Override
    public void reportIssue(Issue issue) {
        // todo：报修后自动给管理员发邮件？
        System.out.println("[Service] New issue reported for scooter #" + issue.getScooterId());
        issueDAO.addIssue(issue);
    }

    @Override
    public List<Issue> viewAllIssues() {
        return issueDAO.findAllIssues();
    }
}