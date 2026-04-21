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
        // todo：报修后自动给管理员发邮件？
        System.out.println("[Service] New issue reported for scooter #" + issue.getScooterId());
        issueDAO.addIssue(issue);
    }

    @Override
    public List<Issue> viewAllIssues() {
        return issueDAO.findAllIssues();
    }

    //f14
    @Override
    @Transactional // 盖戳和贴条必须同时成功
    public void resolveIssue(int issueId) {
        // 盖戳：把报修单状态改成 'resolved'
        issueDAO.updateStatus(issueId, "resolved");

        // todo 贴条：把对应的滑板车状态改成 'maintenance'

        System.out.println("[Service] Issue #" + issueId + " has been resolved.");
    }
}